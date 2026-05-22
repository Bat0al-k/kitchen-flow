"use client";

import type { DeviceFingerprintPayload } from "@/types/user";

const BASE_FONTS = [
    "Arial",
    "Courier New",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Comic Sans MS",
];

function getCanvasFingerprint(): string {
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "no-canvas";
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = "#069";
        ctx.fillText("KitchenFlow🔐", 2, 2);
        ctx.strokeStyle = "rgba(102, 204, 0, 0.7)";
        ctx.strokeRect(2, 2, 180, 40);
        return canvas.toDataURL();
    } catch {
        return "canvas-error";
    }
}

function detectInstalledFonts(): string[] {
    const detected: string[] = [];
    const testSize = "72px";
    const body = document.body;
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = testSize;
    span.innerHTML = "mmmmmmmmmmlli";
    body.appendChild(span);

    const defaultWidths: Record<string, number> = {};
    for (const font of ["monospace", "sans-serif", "serif"]) {
        span.style.fontFamily = font;
        defaultWidths[font] = span.offsetWidth;
    }

    for (const font of BASE_FONTS) {
        let found = false;
        for (const fallback of ["monospace", "sans-serif", "serif"]) {
            span.style.fontFamily = `'${font}',${fallback}`;
            if (span.offsetWidth !== defaultWidths[fallback]) {
                found = true;
                break;
            }
        }
        if (found) detected.push(font);
    }

    body.removeChild(span);
    return detected;
}

export async function collectDeviceFingerprint(): Promise<DeviceFingerprintPayload> {
    return {
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasFingerprint: getCanvasFingerprint(),
        installedFonts: detectInstalledFonts(),
    };
}
