export type PinResetStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PinResetRequest {
    _id?: { toString(): string };
    userId: string;
    status: PinResetStatus;
    requestedAt: string;
    requestedFromDevice: string;
    resolvedAt?: string;
    resolvedBy?: string;
}
