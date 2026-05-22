"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/actions/auth";

interface InactivityAutoLogoutProps {
    isLoggedIn: boolean;
}

export default function InactivityAutoLogout({ isLoggedIn }: InactivityAutoLogoutProps) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Timeout duration: 5 minutes (300,000 ms)
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

    useEffect(() => {
        if (!isLoggedIn) return;

        const handleInactivity = async () => {
            console.log("Inactivity timeout reached. Automatically logging out...");
            await logout();
            window.location.reload();
        };

        const resetTimer = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
        };

        // User activity events to monitor
        const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];

        // Initialize timer
        resetTimer();

        // Bind event listeners
        events.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [isLoggedIn]);

    return null; // This component operates strictly in the background
}
