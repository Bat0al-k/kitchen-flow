export type UserRole = "ADMIN" | "SHIFT_LEADER" | "STAFF" | null;
export type ShiftType = "MORNING" | "EVENING" | null;

export interface DbUser {
    _id: { toString(): string };
    name: string;
    email: string;
    role: UserRole;
    shiftType: ShiftType;
    password: string | null;
    pinHash: string | null;
    deviceIds: string[];
    maxDevices: number;
    isSetup: boolean;
    mustSetPin: boolean;
    pinDeliveryPending: boolean;
    pinAttempts: number;
    lastFailedAt?: Date | string;
    isLockedUntil?: Date | string;
    requiresAdminReset: boolean;
    lastSeenOnLoginAt?: Date | string;
    createdAt: string;
}

export interface DeviceFingerprintPayload {
    userAgent: string;
    screenSize: string;
    timezone: string;
    canvasFingerprint: string;
    installedFonts: string[];
}

export const MAX_DEVICES_BY_ROLE: Record<UserRole, number> = {
    ADMIN: 2,
    SHIFT_LEADER: 1,
};
