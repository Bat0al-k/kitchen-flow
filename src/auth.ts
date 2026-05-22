import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
    authenticateWithPin,
    completeSetupLogin,
} from "@/lib/auth-service";
import type { DeviceFingerprintPayload } from "@/types/user";
import { authConfig } from "./auth.config";

function parseFingerprint(raw: string): DeviceFingerprintPayload | null {
    try {
        return JSON.parse(raw) as DeviceFingerprintPayload;
    } catch {
        return null;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                mode: { type: "text" },
                userId: { type: "text" },
                pin: { type: "text" },
                setupToken: { type: "text" },
                fingerprint: { type: "text" },
            },
            async authorize(credentials) {
                const mode = credentials?.mode as string | undefined;
                const userId = credentials?.userId as string | undefined;
                const fingerprintRaw = credentials?.fingerprint as string | undefined;

                if (!userId || !fingerprintRaw) {
                    return null;
                }

                const fingerprint = parseFingerprint(fingerprintRaw);
                if (!fingerprint) {
                    return null;
                }

                if (mode === "setup") {
                    const setupToken = credentials?.setupToken as string | undefined;
                    if (!setupToken) return null;
                    const result = await completeSetupLogin(
                        userId,
                        setupToken,
                        fingerprint
                    );
                    if ("error" in result) return null;
                    return {
                        id: result.id,
                        name: result.name,
                        email: result.email,
                        role: result.role,
                        shiftType: result.shiftType,
                    };
                }

                if (mode === "pin") {
                    const pin = credentials?.pin as string | undefined;
                    if (!pin) return null;
                    const result = await authenticateWithPin(
                        userId,
                        pin,
                        fingerprint
                    );
                    if ("error" in result) return null;
                    return {
                        id: result.id,
                        name: result.name,
                        email: result.email,
                        role: result.role,
                        shiftType: result.shiftType,
                    };
                }

                return null;
            },
        }),
    ],
});
