export const AUTH_ERRORS = {
    INVALID_PIN: "Invalid PIN. Please try again.",
    ACCOUNT_TEMPORARILY_LOCKED:
        "Account temporarily locked. Try again in 10 minutes.",
    ACCOUNT_REQUIRES_ADMIN_RESET:
        "Too many failed attempts. Contact an administrator to unlock.",
    DEVICE_LIMIT_REACHED:
        "Device limit reached. Ask an administrator to remove a device.",
    USER_NOT_FOUND: "Account not found.",
    SETUP_REQUIRED: "Complete account setup first.",
    PIN_DELIVERY_PENDING: "Waiting for PIN delivery.",
    INVALID_SETUP_TOKEN: "Setup session expired. Please start again.",
    UNAUTHORIZED: "Unauthorized.",
    RATE_LIMITED: "Too many requests. Please wait.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function authErrorMessage(code: string): string {
    return (
        AUTH_ERRORS[code as AuthErrorCode] ??
        "Authentication failed. Please try again."
    );
}
