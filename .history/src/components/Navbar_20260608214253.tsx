"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useTransition } from "react";
import ConnectionStatus from "./realtime/ConnectionStatus";
import SoundToggle from "./realtime/SoundToggle";

interface NavbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: "ADMIN" | "SHIFT_LEADER";
        shiftType: "MORNING" | "EVENING" | null;
    } | null;
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    if (!user) {
        return (
            <nav className="bg-[#0b0b10]/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl">🍳</span>
                        <span className="font-bold text-white text-lg tracking-tight">
                            Kitchen<span className="text-blue-500">Flow</span>
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 justify-end animate-in fade-in duration-300">
                        <ConnectionStatus />
                        <SoundToggle />
                    </div>
                </div>
            </nav>
        );
    }

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    };

    // Role badge configuration
    let badgeLabel = "";
    let badgeStyle = "";

    if (user.role === "ADMIN") {
        badgeLabel = "ADMIN MODE";
        badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else if (user.role === "SHIFT_LEADER") {
        if (user.shiftType === "MORNING") {
            badgeLabel = "MORNING SHIFT LEADER";
            badgeStyle = "bg-sky-500/10 text-sky-400 border-sky-500/20";
        } else {
            badgeLabel = "EVENING SHIFT LEADER";
            badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        }
    }

    return (
        <nav className="bg-[#0b0b10]/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                
                {/* BRAND LOGO */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl">🍳</span>
                    <span className="font-bold text-white text-lg tracking-tight">
                        Kitchen<span className="text-blue-500">Flow</span>
                    </span>
                </div>

                {/* NAVIGATION LINKS */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                    <Link 
                        href="/orders" 
                        className={`text-sm font-medium transition-all ${
                            pathname === "/orders" 
                                ? "text-blue-400 font-semibold" 
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Dashboard
                    </Link>

                    <Link 
                        href="/shifts" 
                        className={`text-sm font-medium transition-all ${
                            pathname === "/shifts" 
                                ? "text-blue-400 font-semibold" 
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Shifts
                    </Link>

                    <Link 
                        href="/orders/completed" 
                        className={`text-sm font-medium transition-all ${
                            pathname === "/orders/completed" 
                                ? "text-blue-400 font-semibold" 
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Completed
                    </Link>

                    {user.role === "ADMIN" && (
                        <>
                            <Link 
                                href="/reports" 
                                className={`text-sm font-medium transition-all ${
                                    pathname === "/reports" 
                                        ? "text-blue-400 font-semibold" 
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                Reports
                            </Link>
                            <Link 
                                href="/admin" 
                                className={`text-sm font-medium transition-all ${
                                    pathname === "/admin" 
                                        ? "text-blue-400 font-semibold" 
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                Security
                            </Link>
                        </>
                    )}
                </div>

                {/* USER PROFILE & LOGOUT */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <ConnectionStatus />
                    <SoundToggle />

                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeStyle}`}>
                        {badgeLabel}
                    </span>

                    <button
                        onClick={handleLogout}
                        disabled={isPending}
                        className="text-xs text-zinc-500 hover:text-red-400 font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-red-500/20 hover:bg-red-500/5 transition-all duration-200"
                    >
                        {isPending ? "Exiting..." : "Logout"}
                    </button>
                </div>

            </div>
        </nav>
    );
}
