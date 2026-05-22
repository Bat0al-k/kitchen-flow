import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
    generatePin,
    generateSetupToken,
    hashDeviceFingerprint,
    hashPassword,
    hashPin,
    verifyPin,
} from "@/lib/auth-crypto";
import { logAction } from "@/lib/audit-log";
import type { DeviceFingerprintPayload, DbUser, UserRole } from "@/types/user";
import { MAX_DEVICES_BY_ROLE } from "@/types/user";

const PIN_REVEAL_MS = 30_000;
const SETUP_TOKEN_MS = 45_000;
const TEMP_LOCK_MS = 10 * 60 * 1000;

function toDate(value: Date | string | undefined): Date | null {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
}

function defaultUserFields(role: UserRole) {
    return {
        deviceIds: [] as string[],
        maxDevices: MAX_DEVICES_BY_ROLE[role],
        isSetup: false,
        mustSetPin: false,
        pinDeliveryPending: false,
        pinAttempts: 0,
        requiresAdminReset: false,
        pinHash: null as string | null,
    };
}

export async function getUsersCollection() {
    const client = await clientPromise;
    return client.db(process.env.MONGODB_DB).collection("users");
}

export async function getPinRevealsCollection() {
    const client = await clientPromise;
    return client.db(process.env.MONGODB_DB).collection("pin_reveals");
}

export async function getSetupTokensCollection() {
    const client = await clientPromise;
    return client.db(process.env.MONGODB_DB).collection("pin_setup_tokens");
}

export async function listAccountsByRole(role: UserRole) {
    const users = await getUsersCollection();
    const docs = await users
        .find({ role })
        .project({ name: 1, email: 1, shiftType: 1, isSetup: 1, mustSetPin: 1 })
        .toArray();
    return docs.map((u) => ({
        id: u._id.toString(),
        name: u.name as string,
        email: u.email as string,
        shiftType: u.shiftType as string | null,
        isSetup: !!u.isSetup,
        mustSetPin: !!u.mustSetPin,
    }));
}

export async function getAccountStatus(userId: string) {
    const users = await getUsersCollection();
    const user = (await users.findOne({
        _id: new ObjectId(userId),
    })) as DbUser | null;
    if (!user) return null;

    const lockedUntil = toDate(user.isLockedUntil);
    const isLocked = lockedUntil ? lockedUntil > new Date() : false;

    return {
        isSetup: !!user.isSetup,
        mustSetPin: !!user.mustSetPin,
        pinDeliveryPending: !!user.pinDeliveryPending,
        isLocked,
        requiresAdminReset: !!user.requiresAdminReset,
        hasPin: !!user.pinHash,
    };
}

async function createPinReveal(userId: string, plainPin: string) {
    const reveals = await getPinRevealsCollection();
    const expiresAt = new Date(Date.now() + PIN_REVEAL_MS);
    await reveals.deleteMany({ userId });
    await reveals.insertOne({
        userId,
        plainPin,
        expiresAt,
        createdAt: new Date().toISOString(),
    });
    return expiresAt;
}

async function createSetupToken(userId: string) {
    const tokens = await getSetupTokensCollection();
    const token = generateSetupToken();
    const expiresAt = new Date(Date.now() + SETUP_TOKEN_MS);
    await tokens.deleteMany({ userId });
    await tokens.insertOne({
        userId,
        token,
        expiresAt,
        consumed: false,
        createdAt: new Date().toISOString(),
    });
    return token;
}

export async function registerDevice(
    user: DbUser,
    deviceHash: string
): Promise<{ ok: true } | { ok: false; code: string }> {
    if (user.deviceIds?.includes(deviceHash)) {
        return { ok: true };
    }
    const max = user.maxDevices ?? MAX_DEVICES_BY_ROLE[user.role];
    if ((user.deviceIds?.length ?? 0) >= max) {
        return { ok: false, code: "DEVICE_LIMIT_REACHED" };
    }
    const users = await getUsersCollection();
    await users.updateOne(
        { _id: user._id },
        { $push: { deviceIds: deviceHash } }
    );
    return { ok: true };
}

export async function setupPassword(
    userId: string,
    password: string
): Promise<{ success: true } | { error: string }> {
    if (!password || password.length < 6) {
        return { error: "Password must be at least 6 characters." };
    }
    const users = await getUsersCollection();
    const result = await users.updateOne(
        { _id: new ObjectId(userId), isSetup: false },
        {
            $set: {
                password: hashPassword(password),
            },
        }
    );
    if (result.matchedCount === 0) {
        return { error: "Account not found or already set up." };
    }
    return { success: true };
}

/** System-generated PIN for setup or delivery; never returned from this function. */
export async function generateAndDeliverPin(
    userId: string,
    purpose: "SETUP" | "DELIVERY"
): Promise<
    | { success: true; expiresAt: string; setupToken: string }
    | { error: string; code?: string }
> {
    const users = await getUsersCollection();
    const user = (await users.findOne({
        _id: new ObjectId(userId),
    })) as DbUser | null;
    if (!user) return { error: "Account not found.", code: "USER_NOT_FOUND" };

    if (user.requiresAdminReset) {
        return {
            error: "Account locked. Administrator must reset your access.",
            code: "ACCOUNT_REQUIRES_ADMIN_RESET",
        };
    }

    const lockedUntil = toDate(user.isLockedUntil);
    if (lockedUntil && lockedUntil > new Date()) {
        return {
            error: "Account temporarily locked.",
            code: "ACCOUNT_TEMPORARILY_LOCKED",
        };
    }

    if (purpose === "SETUP" && user.isSetup) {
        return { error: "Account already set up." };
    }

    const plainPin = generatePin();
    const pinHash = hashPin(plainPin);
    const setupToken = await createSetupToken(userId);
    const expiresAt = await createPinReveal(userId, plainPin);

    const update: Record<string, unknown> = {
        pinHash,
        pinAttempts: 0,
        isLockedUntil: null,
        requiresAdminReset: false,
        mustSetPin: false,
        pinDeliveryPending: false,
        lastFailedAt: null,
    };

    if (purpose === "SETUP") {
        update.isSetup = true;
    }

    await users.updateOne({ _id: user._id }, { $set: update });

    return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        setupToken,
    };
}

export async function consumeSetupToken(
    userId: string,
    setupToken: string
): Promise<boolean> {
    const tokens = await getSetupTokensCollection();
    const doc = await tokens.findOne({
        userId,
        token: setupToken,
        consumed: false,
    });
    if (!doc) return false;
    const expiresAt = toDate(doc.expiresAt);
    if (!expiresAt || expiresAt < new Date()) return false;
    await tokens.updateOne({ _id: doc._id }, { $set: { consumed: true } });
    return true;
}

export async function pollPinReveal(userId: string): Promise<{
    available: boolean;
    pin?: string;
    secondsRemaining?: number;
    setupToken?: string;
}> {
    const reveals = await getPinRevealsCollection();
    const doc = await reveals.findOne({ userId });
    if (!doc) return { available: false };

    const expiresAt = toDate(doc.expiresAt);
    if (!expiresAt || expiresAt < new Date()) {
        await reveals.deleteMany({ userId });
        return { available: false };
    }

    const secondsRemaining = Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
    );

    const tokens = await getSetupTokensCollection();
    const tokenDoc = await tokens.findOne({ userId, consumed: false });
    const tokenExpires = tokenDoc ? toDate(tokenDoc.expiresAt) : null;
    const setupToken =
        tokenDoc &&
        tokenExpires &&
        tokenExpires > new Date() &&
        !(tokenDoc.consumed as boolean)
            ? (tokenDoc.token as string)
            : undefined;

    return {
        available: true,
        pin: doc.plainPin as string,
        secondsRemaining,
        setupToken,
    };
}

export async function updateLoginHeartbeat(userId: string, step: string) {
    const users = await getUsersCollection();
    await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { lastSeenOnLoginAt: new Date(), lastLoginStep: step } }
    );

    const user = (await users.findOne({
        _id: new ObjectId(userId),
    })) as DbUser | null;
    if (!user?.pinDeliveryPending || step !== "PIN_WAIT") {
        return { triggered: false };
    }

    const result = await generateAndDeliverPin(userId, "DELIVERY");
    if ("error" in result) {
        return { triggered: false, error: result.error };
    }
    return {
        triggered: true,
        expiresAt: result.expiresAt,
        setupToken: result.setupToken,
    };
}

export async function authenticateWithPin(
    userId: string,
    pin: string,
    fingerprint: DeviceFingerprintPayload
): Promise<
    | {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          shiftType: DbUser["shiftType"];
      }
    | { error: string; code: string }
> {
    const users = await getUsersCollection();
    const user = (await users.findOne({
        _id: new ObjectId(userId),
    })) as DbUser | null;

    if (!user || !user.isSetup || !user.pinHash) {
        return { error: "Account not ready.", code: "SETUP_REQUIRED" };
    }

    if (user.mustSetPin || user.pinDeliveryPending) {
        return { error: "Set up your new PIN first.", code: "PIN_DELIVERY_PENDING" };
    }

    if (user.requiresAdminReset) {
        return {
            error: "Administrator reset required.",
            code: "ACCOUNT_REQUIRES_ADMIN_RESET",
        };
    }

    const lockedUntil = toDate(user.isLockedUntil);
    if (lockedUntil && lockedUntil > new Date()) {
        return {
            error: "Account temporarily locked.",
            code: "ACCOUNT_TEMPORARILY_LOCKED",
        };
    }

    const deviceHash = hashDeviceFingerprint(fingerprint);

    if (!user.deviceIds?.includes(deviceHash)) {
        const reg = await registerDevice(user, deviceHash);
        if (!reg.ok) {
            return { error: "Device limit reached.", code: reg.code };
        }
    }

    const valid = verifyPin(pin, user.pinHash);
    if (!valid) {
        const attempts = (user.pinAttempts ?? 0) + 1;
        const update: Record<string, unknown> = {
            pinAttempts: attempts,
            lastFailedAt: new Date(),
        };

        if (attempts >= 10) {
            update.requiresAdminReset = true;
            update.isLockedUntil = null;
            await logAction("PIN_LOCK_ADMIN_REQUIRED", userId, userId);
        } else if (attempts >= 5) {
            update.isLockedUntil = new Date(Date.now() + TEMP_LOCK_MS);
        }

        await users.updateOne({ _id: user._id }, { $set: update });

        if (attempts >= 10) {
            return {
                error: "Too many attempts. Contact administrator.",
                code: "ACCOUNT_REQUIRES_ADMIN_RESET",
            };
        }
        if (attempts >= 5) {
            return {
                error: "Account temporarily locked for 10 minutes.",
                code: "ACCOUNT_TEMPORARILY_LOCKED",
            };
        }
        return { error: "Invalid PIN.", code: "INVALID_PIN" };
    }

    await users.updateOne(
        { _id: user._id },
        {
            $set: {
                pinAttempts: 0,
                lastFailedAt: null,
                isLockedUntil: null,
            },
        }
    );

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        shiftType: user.shiftType ?? null,
    };
}

export async function completeSetupLogin(
    userId: string,
    setupToken: string,
    fingerprint: DeviceFingerprintPayload
): Promise<
    | {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          shiftType: DbUser["shiftType"];
      }
    | { error: string; code: string }
> {
    const valid = await consumeSetupToken(userId, setupToken);
    if (!valid) {
        return { error: "Setup expired.", code: "INVALID_SETUP_TOKEN" };
    }

    const users = await getUsersCollection();
    const user = (await users.findOne({
        _id: new ObjectId(userId),
    })) as DbUser | null;

    if (!user || !user.isSetup || !user.pinHash) {
        return { error: "Account not ready.", code: "SETUP_REQUIRED" };
    }

    const deviceHash = hashDeviceFingerprint(fingerprint);
    const reg = await registerDevice(user, deviceHash);
    if (!reg.ok) {
        return { error: "Device limit reached.", code: reg.code };
    }

    await users.updateOne(
        { _id: user._id },
        {
            $set: {
                pinAttempts: 0,
                mustSetPin: false,
                pinDeliveryPending: false,
            },
        }
    );

    const reveals = await getPinRevealsCollection();
    await reveals.deleteMany({ userId });

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        shiftType: user.shiftType ?? null,
    };
}

export async function requestPinReset(
    userId: string,
    deviceHash: string
): Promise<{ success: true } | { error: string }> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const existing = await db.collection("pin_reset_requests").findOne({
        userId,
        status: "PENDING",
    });
    if (existing) {
        return { error: "A reset request is already pending." };
    }
    await db.collection("pin_reset_requests").insertOne({
        userId,
        status: "PENDING",
        requestedAt: new Date().toISOString(),
        requestedFromDevice: deviceHash,
    });
    await logAction("PIN_RESET_REQUESTED", userId);
    return { success: true };
}

export async function migrateLegacyUser(doc: Record<string, unknown>) {
    const role = doc.role as UserRole;
    const defaults = defaultUserFields(role);
    const users = await getUsersCollection();
    await users.updateOne(
        { _id: doc._id },
        {
            $set: {
                ...defaults,
                isSetup: !!doc.password && !doc.pinHash ? false : !!doc.isSetup,
            },
        }
    );
}

export function ensureUserDefaults(
    doc: Record<string, unknown>
): Record<string, unknown> {
    const role = (doc.role as UserRole) ?? "SHIFT_LEADER";
    return {
        ...defaultUserFields(role),
        ...doc,
        maxDevices:
            doc.maxDevices ?? MAX_DEVICES_BY_ROLE[role as UserRole],
        deviceIds: doc.deviceIds ?? [],
        pinAttempts: doc.pinAttempts ?? 0,
    };
}
