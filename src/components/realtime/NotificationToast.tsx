"use client";

import { useRealtimeContext } from "@/lib/realtime/RealtimeContext";

export default function NotificationToast() {
  const { toasts, removeToast } = useRealtimeContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const typeStyles = {
          info: {
            bg: "bg-[#11111a]/90",
            border: "border-blue-500/30",
            icon: "🔵",
            progress: "bg-blue-500",
          },
          success: {
            bg: "bg-[#0f1b14]/90",
            border: "border-emerald-500/30",
            icon: "🟢",
            progress: "bg-emerald-500",
          },
          warning: {
            bg: "bg-[#1f1611]/90",
            border: "border-amber-500/30",
            icon: "🟡",
            progress: "bg-amber-500",
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex flex-col overflow-hidden rounded-xl border ${typeStyles.border} ${typeStyles.bg} shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-x-0 animate-slideInRight`}
          >
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{typeStyles.icon}</span>
                <p className="text-zinc-200 text-sm font-semibold tracking-wide">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 text-xs p-1 cursor-pointer transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            {/* Auto-dismiss progress bar */}
            <div className="h-0.5 w-full bg-zinc-800/40">
              <div className={`h-full ${typeStyles.progress} animate-toastProgress`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
