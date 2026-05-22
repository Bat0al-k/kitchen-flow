"use client";

import { useEffect, useState, useTransition } from "react";
import {
    approvePinReset,
    listPinResetRequests,
    listUsersForAdmin,
    rejectPinReset,
    removeUserDevice,
    unlockUserAccount,
} from "@/app/actions/admin-auth";

interface ResetRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    shiftType: string | null;
    requestedAt: string;
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    shiftType: string | null;
    deviceIds: string[];
    maxDevices: number;
    pinAttempts: number;
    requiresAdminReset: boolean;
    isLockedUntil?: string | Date;
}

export default function AdminAuthPanel() {
    const [requests, setRequests] = useState<ResetRequest[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const load = () => {
        startTransition(async () => {
            const [reqs, usrs] = await Promise.all([
                listPinResetRequests(),
                listUsersForAdmin(),
            ]);
            setRequests(reqs as ResetRequest[]);
            setUsers(usrs as AdminUser[]);
        });
    };

    useEffect(() => {
        load();
    }, []);

    const handleApprove = (id: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await approvePinReset(id);
            if ("error" in result) {
                setMessage(result.error);
            } else {
                setMessage(result.message ?? "Approved.");
                load();
            }
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            await rejectPinReset(id);
            load();
        });
    };

    const handleUnlock = (userId: string) => {
        startTransition(async () => {
            await unlockUserAccount(userId);
            setMessage("User unlocked.");
            load();
        });
    };

    const handleRemoveDevice = (userId: string, deviceId: string) => {
        startTransition(async () => {
            await removeUserDevice(userId, deviceId);
            setMessage("Device removed.");
            load();
        });
    };

    return (
        <div className="space-y-10">
            {message && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-4 py-3 rounded-xl">
                    {message}
                </div>
            )}

            <section>
                <h2 className="text-lg font-bold mb-4">Pending PIN reset requests</h2>
                {requests.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No pending requests.</p>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-[#111118] border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div>
                                    <p className="font-medium">{req.userName}</p>
                                    <p className="text-zinc-500 text-xs">{req.userEmail}</p>
                                    <p className="text-zinc-600 text-xs mt-1">
                                        {new Date(req.requestedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(req.id)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-600/30 disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-600/30 disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-bold mb-4">Users & devices</h2>
                <div className="space-y-4">
                    {users.map((u) => (
                        <div
                            key={u.id}
                            className="bg-[#111118] border border-zinc-800 rounded-xl p-4"
                        >
                            <div className="flex flex-wrap justify-between gap-2 mb-3">
                                <div>
                                    <p className="font-medium">{u.name}</p>
                                    <p className="text-zinc-500 text-xs">
                                        {u.role}
                                        {u.shiftType ? ` · ${u.shiftType}` : ""}
                                    </p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {(u.requiresAdminReset ||
                                        (u.pinAttempts >= 5 && u.isLockedUntil)) && (
                                        <button
                                            onClick={() => handleUnlock(u.id)}
                                            disabled={isPending}
                                            className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold"
                                        >
                                            Unlock
                                        </button>
                                    )}
                                    <span className="text-xs text-zinc-500">
                                        {u.deviceIds.length}/{u.maxDevices} devices
                                    </span>
                                </div>
                            </div>
                            {u.deviceIds.length === 0 ? (
                                <p className="text-zinc-600 text-xs">No bound devices</p>
                            ) : (
                                <ul className="space-y-2">
                                    {u.deviceIds.map((d) => (
                                        <li
                                            key={d}
                                            className="flex items-center justify-between text-xs bg-[#0a0a0f] px-3 py-2 rounded-lg border border-zinc-800/80"
                                        >
                                            <code className="text-zinc-400 truncate max-w-[200px]">
                                                {d.slice(0, 16)}…
                                            </code>
                                            <button
                                                onClick={() =>
                                                    handleRemoveDevice(u.id, d)
                                                }
                                                disabled={isPending}
                                                className="text-red-400 hover:text-red-300 font-medium shrink-0 ml-2"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
