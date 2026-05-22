"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
    checkAccountStatus,
    fetchPinReveal,
    finishSetupLogin,
    getLoginAccounts,
    loginWithPin,
    saveSetupPassword,
    sendLoginHeartbeat,
    startPinGeneration,
    submitForgotPinRequest,
} from "@/app/actions/auth";
import { collectDeviceFingerprint } from "@/lib/device-fingerprint";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/user";

interface LoginModalProps {
    onClose: () => void;
}

type Step =
    | "ROLE"
    | "ACCOUNT"
    | "PASSWORD"
    | "PIN_REVEAL"
    | "PIN_ENTRY"
    | "PIN_WAIT";

interface AccountOption {
    id: string;
    name: string;
    email: string;
    shiftType: string | null;
    isSetup: boolean;
    mustSetPin: boolean;
}

const PIN_DISPLAY_SECONDS = 30;

export default function LoginModal({ onClose }: LoginModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("ROLE");
    const [role, setRole] = useState<UserRole | null>(null);
    const [accounts, setAccounts] = useState<AccountOption[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [fingerprintJson, setFingerprintJson] = useState<string>("");
    const [setupToken, setSetupToken] = useState<string | null>(null);
    const [revealedPin, setRevealedPin] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(PIN_DISPLAY_SECONDS);
    const [resetRequested, setResetRequested] = useState(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        collectDeviceFingerprint().then((fp) => {
            setFingerprintJson(JSON.stringify(fp));
        });
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const clearTimers = useCallback(() => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        heartbeatRef.current = null;
        pollRef.current = null;
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const handleRoleSelect = (r: UserRole) => {
        setRole(r);
        setError(null);
        startTransition(async () => {
            const list = await getLoginAccounts(r);
            setAccounts(list);
            setStep("ACCOUNT");
        });
    };

    const handleAccountSelect = async (account: AccountOption) => {
        setSelectedAccount(account);
        setError(null);
        const status = await checkAccountStatus(account.id);
        if (!status) {
            setError("Account not found.");
            return;
        }
        if (status.requiresAdminReset) {
            setError("Account locked. Contact an administrator.");
            return;
        }
        if (status.isLocked) {
            setError("Account temporarily locked. Try again later.");
            return;
        }
        if (!status.isSetup) {
            setStep("PASSWORD");
            return;
        }
        if (status.mustSetPin || status.pinDeliveryPending) {
            setStep("PIN_WAIT");
            return;
        }
        setStep("PIN_ENTRY");
    };

    const runPinRevealFlow = useCallback(
        async (token: string) => {
            setSetupToken(token);
            setStep("PIN_REVEAL");
            setCountdown(PIN_DISPLAY_SECONDS);

            pollRef.current = setInterval(async () => {
                if (!selectedAccount) return;
                const reveal = await fetchPinReveal(selectedAccount.id);
                if (reveal.available && reveal.pin) {
                    setRevealedPin(reveal.pin);
                    if (reveal.secondsRemaining != null) {
                        setCountdown(reveal.secondsRemaining);
                    }
                }
            }, 500);

            setTimeout(() => {
                clearTimers();
                setRevealedPin(null);
                if (!selectedAccount || !fingerprintJson) return;
                startTransition(async () => {
                    const result = await finishSetupLogin(
                        selectedAccount.id,
                        token,
                        fingerprintJson
                    );
                    if (result?.error) {
                        setError(result.error);
                        setStep("ACCOUNT");
                        return;
                    }
                    router.refresh();
                    onClose();
                });
            }, PIN_DISPLAY_SECONDS * 1000);
        },
        [selectedAccount, fingerprintJson, clearTimers, router, onClose]
    );

    useEffect(() => {
        if (step !== "PIN_WAIT" || !selectedAccount) return;

        const tick = async () => {
            const heartbeat = await sendLoginHeartbeat(
                selectedAccount.id,
                "PIN_WAIT"
            );
            const reveal = await fetchPinReveal(selectedAccount.id);
            const token =
                reveal.setupToken ??
                (heartbeat as { setupToken?: string }).setupToken;
            if (reveal.available && reveal.pin && token) {
                clearTimers();
                setSetupToken(token);
                setRevealedPin(reveal.pin);
                setStep("PIN_REVEAL");
                setCountdown(reveal.secondsRemaining ?? PIN_DISPLAY_SECONDS);

                setTimeout(() => {
                    clearTimers();
                    setRevealedPin(null);
                    startTransition(async () => {
                        const result = await finishSetupLogin(
                            selectedAccount.id,
                            token,
                            fingerprintJson
                        );
                        if (result?.error) {
                            setError(result.error);
                            setStep("PIN_WAIT");
                            return;
                        }
                        router.refresh();
                        onClose();
                    });
                }, (reveal.secondsRemaining ?? PIN_DISPLAY_SECONDS) * 1000);
            }
        };

        tick();
        heartbeatRef.current = setInterval(tick, 4000);
        pollRef.current = setInterval(tick, 1500);

        return () => clearTimers();
    }, [step, selectedAccount, setupToken, runPinRevealFlow, clearTimers]);

    const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAccount) return;
        const password = new FormData(e.currentTarget).get("password") as string;
        setError(null);

        startTransition(async () => {
            const saved = await saveSetupPassword(selectedAccount.id, password);
            if (saved.error) {
                setError(saved.error);
                return;
            }
            const gen = await startPinGeneration(selectedAccount.id, "SETUP");
            if (gen.error || !gen.setupToken) {
                setError(gen.error ?? "Could not generate PIN.");
                return;
            }
            await runPinRevealFlow(gen.setupToken);
        });
    };

    const handlePinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAccount || !fingerprintJson) return;
        const pin = new FormData(e.currentTarget).get("pin") as string;
        setError(null);

        startTransition(async () => {
            const result = await loginWithPin(
                selectedAccount.id,
                pin,
                fingerprintJson
            );
            if (result?.error) {
                setError(result.error);
                return;
            }
            router.refresh();
            onClose();
        });
    };

    const handleForgotPin = () => {
        if (!selectedAccount || !fingerprintJson) return;
        setError(null);
        startTransition(async () => {
            const result = await submitForgotPinRequest(
                selectedAccount.id,
                fingerprintJson
            );
            if (result?.error) {
                setError(result.error);
                return;
            }
            setResetRequested(true);
        });
    };

    const goBack = () => {
        clearTimers();
        setRevealedPin(null);
        setSetupToken(null);
        setError(null);
        if (step === "ACCOUNT") {
            setStep("ROLE");
            setRole(null);
        } else if (
            step === "PASSWORD" ||
            step === "PIN_ENTRY" ||
            step === "PIN_WAIT" ||
            step === "PIN_REVEAL"
        ) {
            setStep("ACCOUNT");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-md bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-8 relative animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors text-lg"
                    aria-label="Close modal"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <span className="text-3xl">🔐</span>
                    <h2 className="text-2xl font-bold text-white mt-3">
                        Management Access
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Secure PIN login with device binding
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl text-center font-medium mb-4">
                        {error}
                    </div>
                )}

                {resetRequested && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm px-4 py-2.5 rounded-xl text-center mb-4">
                        Reset request sent. An administrator must approve it.
                    </div>
                )}

                {step !== "ROLE" && (
                    <button
                        type="button"
                        onClick={goBack}
                        className="text-xs text-zinc-500 hover:text-zinc-300 mb-4"
                    >
                        ← Back
                    </button>
                )}

                {step === "ROLE" && (
                    <div className="space-y-3">
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2">
                            Select role
                        </p>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect("ADMIN")}
                            disabled={isPending}
                            className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-colors"
                        >
                            Administrator
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect("SHIFT_LEADER")}
                            disabled={isPending}
                            className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl transition-colors"
                        >
                            Shift Leader
                        </button>
                    </div>
                )}

                {step === "ACCOUNT" && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2">
                            {role === "ADMIN" ? "Admin accounts" : "Shift leaders"}
                        </p>
                        {accounts.map((acc) => (
                            <button
                                key={acc.id}
                                type="button"
                                onClick={() => handleAccountSelect(acc)}
                                className="w-full text-left px-4 py-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl hover:border-blue-500/50 transition-colors"
                            >
                                <p className="text-white font-medium">{acc.name}</p>
                                <p className="text-zinc-500 text-xs">{acc.email}</p>
                                {acc.shiftType && (
                                    <span className="text-xs text-indigo-400">
                                        {acc.shiftType} shift
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {step === "PASSWORD" && selectedAccount && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <p className="text-zinc-400 text-sm">
                            First-time setup for <strong>{selectedAccount.name}</strong>.
                            Create your management password (used for recovery only).
                        </p>
                        <div>
                            <label className="block text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                minLength={6}
                                placeholder="Min. 6 characters"
                                className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                        >
                            {isPending ? "Setting up..." : "Continue → Generate PIN"}
                        </button>
                    </form>
                )}

                {step === "PIN_WAIT" && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-zinc-300">
                            Waiting for your system PIN…
                        </p>
                        <p className="text-zinc-500 text-xs">
                            Stay on this screen. If an admin approved a reset, your
                            PIN will appear here automatically.
                        </p>
                    </div>
                )}

                {step === "PIN_REVEAL" && (
                    <div className="text-center py-4 space-y-4">
                        <p className="text-zinc-400 text-sm">
                            Your system-generated PIN (save it now — it will not be
                            shown again)
                        </p>
                        <div className="bg-[#0a0a0f] border-2 border-emerald-500/40 rounded-2xl py-6 px-4">
                            <p className="text-4xl font-mono font-bold text-emerald-400 tracking-[0.3em]">
                                {revealedPin ?? "······"}
                            </p>
                        </div>
                        <p className="text-amber-400 text-sm font-medium">
                            Auto-login in {countdown}s
                        </p>
                        <p className="text-zinc-600 text-xs">
                            After logout you will enter this PIN manually.
                        </p>
                    </div>
                )}

                {step === "PIN_ENTRY" && selectedAccount && (
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <p className="text-zinc-400 text-sm">
                            Enter your 6-digit PIN for {selectedAccount.name}
                        </p>
                        <div>
                            <label className="block text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                                PIN
                            </label>
                            <input
                                name="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="••••••"
                                className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-blue-500"
                                required
                                autoComplete="off"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleForgotPin}
                            className="text-xs text-zinc-500 hover:text-blue-400 w-full text-center"
                        >
                            Forgot PIN? Request admin reset
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !fingerprintJson}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                        >
                            {isPending ? "Verifying..." : "Unlock"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
