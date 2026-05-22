"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import {
    authenticateWithPin,
    completeSetupLogin,
    generateAndDeliverPin,
    getAccountStatus,
    listAccountsByRole,
    pollPinReveal,
    requestPinReset,
    setupPassword,
    updateLoginHeartbeat,
} from "@/lib/auth-service";
import { hashDeviceFingerprint } from "@/lib/auth-crypto";
import type { ActionResult, PinGenerationResult } from "@/types/action-results";
import type { DeviceFingerprintPayload, UserRole } from "@/types/user";

function parseFingerprint(raw: string): DeviceFingerprintPayload | null {
    try {
        return JSON.parse(raw) as DeviceFingerprintPayload;
    } catch {
        return null;
    }
}

export async function getLoginAccounts(role: UserRole) {
    return listAccountsByRole(role);
}

export async function checkAccountStatus(userId: string) {
    return getAccountStatus(userId);
}

export async function saveSetupPassword(
    userId: string,
    password: string
): Promise<ActionResult> {
    return setupPassword(userId, password);
}

export async function startPinGeneration(
    userId: string,
    mode: "SETUP" | "DELIVERY"
): Promise<PinGenerationResult> {
    const purpose = mode === "SETUP" ? "SETUP" : "DELIVERY";
    const result = await generateAndDeliverPin(userId, purpose);
    if ("error" in result) {
        return {
            error: authErrorMessage(result.code ?? "") || result.error,
            code: result.code,
        };
    }
    return {
        success: true as const,
        expiresAt: result.expiresAt,
        setupToken: result.setupToken,
    };
}

export async function fetchPinReveal(userId: string) {
    return pollPinReveal(userId);
}

export async function sendLoginHeartbeat(userId: string, step: string) {
    return updateLoginHeartbeat(userId, step);
}

export async function loginWithPin(
    userId: string,
    pin: string,
    fingerprintJson: string
): Promise<ActionResult> {
    const fingerprint = parseFingerprint(fingerprintJson);
    if (!fingerprint) {
        return { error: "Invalid device fingerprint." };
    }

    const result = await authenticateWithPin(userId, pin, fingerprint);
    if ("error" in result) {
        return { error: authErrorMessage(result.code), code: result.code };
    }

    try {
        await signIn("credentials", {
            mode: "pin",
            userId: result.id,
            pin,
            fingerprint: fingerprintJson,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Authentication failed." };
        }
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        return { error: "Authentication failed." };
    }
}

export async function finishSetupLogin(
    userId: string,
    setupToken: string,
    fingerprintJson: string
): Promise<ActionResult> {
    const fingerprint = parseFingerprint(fingerprintJson);
    if (!fingerprint) {
        return { error: "Invalid device fingerprint." };
    }

    const result = await completeSetupLogin(userId, setupToken, fingerprint);
    if ("error" in result) {
        return { error: authErrorMessage(result.code), code: result.code };
    }

    try {
        await signIn("credentials", {
            mode: "setup",
            userId: result.id,
            setupToken,
            fingerprint: fingerprintJson,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Authentication failed." };
        }
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        return { error: "Authentication failed." };
    }
}

export async function submitForgotPinRequest(
    userId: string,
    fingerprintJson: string
): Promise<ActionResult> {
    const fingerprint = parseFingerprint(fingerprintJson);
    if (!fingerprint) {
        return { error: "Invalid device fingerprint." };
    }
    const deviceHash = hashDeviceFingerprint(fingerprint);
    const result = await requestPinReset(userId, deviceHash);
    if ("error" in result) {
        return { error: result.error };
    }
    return { success: true };
}

export async function logout() {
    await signOut({ redirectTo: "/orders" });
}

export async function getCurrentUser() {
    const session = await auth();
    return session?.user || null;
}
