import crypto from "crypto";
import type { DeviceFingerprintPayload } from "@/types/user";

/**
 * Hashes a plain password using PBKDF2 with a random salt.
 * Returns the hash in the format: salt:hash
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return `${salt}:${hash}`;
}

/**
 * Verifies a plain password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
    if (!storedValue || !storedValue.includes(":")) {
        return false;
    }
    const [salt, originalHash] = storedValue.split(":");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return hash === originalHash;
}

export function hashPin(pin: string): string {
    return hashPassword(pin);
}

export function verifyPin(pin: string, storedValue: string | null): boolean {
    if (!storedValue) return false;
    return verifyPassword(pin, storedValue);
}

/** 6-digit system-generated PIN */
export function generatePin(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export function hashDeviceFingerprint(payload: DeviceFingerprintPayload): string {
    const canonical = JSON.stringify({
        userAgent: payload.userAgent,
        screenSize: payload.screenSize,
        timezone: payload.timezone,
        canvasFingerprint: payload.canvasFingerprint,
        installedFonts: [...payload.installedFonts].sort(),
    });
    return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function generateSetupToken(): string {
    return crypto.randomBytes(32).toString("hex");
}
