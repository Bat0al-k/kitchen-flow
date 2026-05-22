"use server";

import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { generateAndDeliverPin, getUsersCollection } from "@/lib/auth-service";
import { logAction } from "@/lib/audit-log";

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("UNAUTHORIZED");
    }
    return session.user;
}

export async function listPinResetRequests() {
    await requireAdmin();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const requests = await db
        .collection("pin_reset_requests")
        .find({ status: "PENDING" })
        .sort({ requestedAt: -1 })
        .toArray();

    const users = await getUsersCollection();
    const enriched = await Promise.all(
        requests.map(async (req) => {
            const user = await users.findOne({
                _id: new ObjectId(req.userId as string),
            });
            return {
                id: req._id?.toString(),
                userId: req.userId,
                userName: user?.name ?? "Unknown",
                userEmail: user?.email ?? "",
                role: user?.role,
                shiftType: user?.shiftType,
                requestedAt: req.requestedAt,
                requestedFromDevice: req.requestedFromDevice,
            };
        })
    );
    return enriched;
}

export async function approvePinReset(requestId: string) {
    const admin = await requireAdmin();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const requests = db.collection("pin_reset_requests");
    const req = await requests.findOne({
        _id: new ObjectId(requestId),
        status: "PENDING",
    });
    if (!req) {
        return { error: "Request not found." };
    }

    const userId = req.userId as string;
    const users = await getUsersCollection();

    await users.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                pinHash: null,
                mustSetPin: true,
                pinDeliveryPending: true,
                pinAttempts: 0,
                isLockedUntil: null,
                requiresAdminReset: false,
            },
        }
    );

    await requests.updateOne(
        { _id: req._id },
        {
            $set: {
                status: "APPROVED",
                resolvedAt: new Date().toISOString(),
                resolvedBy: admin.id,
            },
        }
    );

    await logAction("PIN_RESET_APPROVED", admin.id!, userId);

    const user = await users.findOne({ _id: new ObjectId(userId) });
    const lastSeen = user?.lastSeenOnLoginAt
        ? new Date(user.lastSeenOnLoginAt as string | Date)
        : null;
    const online =
        lastSeen && Date.now() - lastSeen.getTime() < 20_000;

    if (online) {
        const delivery = await generateAndDeliverPin(userId, "DELIVERY");
        if ("error" in delivery) {
            return {
                success: true,
                deliveryPending: true,
                message:
                    "Approved. PIN will appear when the user is on the login PIN step.",
            };
        }
        return {
            success: true,
            deliveryPending: false,
            message: "Approved. PIN is being shown on the user's login screen.",
        };
    }

    return {
        success: true,
        deliveryPending: true,
        message:
            "Approved. PIN will be generated when the user opens the login PIN step.",
    };
}

export async function rejectPinReset(requestId: string) {
    const admin = await requireAdmin();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection("pin_reset_requests").updateOne(
        { _id: new ObjectId(requestId), status: "PENDING" },
        {
            $set: {
                status: "REJECTED",
                resolvedAt: new Date().toISOString(),
                resolvedBy: admin.id,
            },
        }
    );
    if (result.matchedCount === 0) {
        return { error: "Request not found." };
    }
    await logAction("PIN_RESET_REJECTED", admin.id!, requestId);
    return { success: true };
}

export async function removeUserDevice(targetUserId: string, deviceId: string) {
    const admin = await requireAdmin();
    const users = await getUsersCollection();
    const result = await users.updateOne(
        { _id: new ObjectId(targetUserId) },
        { $pull: { deviceIds: deviceId } }
    );
    if (result.matchedCount === 0) {
        return { error: "User not found." };
    }
    await logAction("DEVICE_REMOVED", admin.id!, `${targetUserId}:${deviceId}`);
    return { success: true };
}

export async function unlockUserAccount(targetUserId: string) {
    const admin = await requireAdmin();
    const users = await getUsersCollection();
    await users.updateOne(
        { _id: new ObjectId(targetUserId) },
        {
            $set: {
                pinAttempts: 0,
                isLockedUntil: null,
                requiresAdminReset: false,
                lastFailedAt: null,
            },
        }
    );
    await logAction("USER_UNLOCKED", admin.id!, targetUserId);
    return { success: true };
}

export async function listUsersForAdmin() {
    await requireAdmin();
    const users = await getUsersCollection();
    const docs = await users
        .find({})
        .project({
            name: 1,
            email: 1,
            role: 1,
            shiftType: 1,
            deviceIds: 1,
            maxDevices: 1,
            pinAttempts: 1,
            isLockedUntil: 1,
            requiresAdminReset: 1,
        })
        .toArray();

    return docs.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        shiftType: u.shiftType,
        deviceIds: (u.deviceIds as string[]) ?? [],
        maxDevices: u.maxDevices,
        pinAttempts: u.pinAttempts ?? 0,
        isLockedUntil: u.isLockedUntil,
        requiresAdminReset: !!u.requiresAdminReset,
    }));
}

export async function adminAuthActionError(code: string) {
    return authErrorMessage(code);
}
