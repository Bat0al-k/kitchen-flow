"use client";

import { useRealtimeContext } from "@/lib/realtime/RealtimeContext";

export default function ConnectionStatus() {
  const { status } = useRealtimeContext();

  const config = {
    connected: {
      color: "bg-emerald-500",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      label: "Live",
      pulse: "animate-pulse",
    },
    reconnecting: {
      color: "bg-amber-500",
      border: "border-amber-500/20",
      text: "text-amber-400",
      label: "Syncing...",
      pulse: "animate-spin", // We'll style it to rotate or pulse in CSS
    },
    disconnected: {
      color: "bg-rose-500",
      border: "border-rose-500/20",
      text: "text-rose-400",
      label: "Offline",
      pulse: "",
    },
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-zinc-900/40 ${config.border} transition-all duration-300`}>
      <span className="relative flex h-2 w-2">
        {status === "connected" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color} ${config.pulse}`}></span>
      </span>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
