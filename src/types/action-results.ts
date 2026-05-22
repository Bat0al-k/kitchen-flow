export type ActionError = { readonly error: string; readonly code?: string };
export type ActionSuccess = { readonly success: true };
export type ActionResult = ActionError | ActionSuccess;

export type PinGenerationSuccess = {
    readonly success: true;
    readonly expiresAt: string;
    readonly setupToken: string;
};
export type PinGenerationResult = ActionError | PinGenerationSuccess;

export type ApprovePinResetSuccess = {
    readonly success: true;
    readonly deliveryPending: boolean;
    readonly message: string;
};
export type ApprovePinResetResult = ActionError | ApprovePinResetSuccess;
