"use client";

import { useRealtimeContext } from "@/lib/realtime/RealtimeContext";

export default function SoundToggle() {
  const { isMuted, toggleMute } = useRealtimeContext();

  return (
    <button
      onClick={toggleMute}
      className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
        isMuted
          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
          : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
      }`}
      title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
      aria-label={isMuted ? "Unmute Notifications" : "Mute Notifications"}
    >
      <div className="flex items-center gap-1.5 px-1">
        {isMuted ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="22" y1="9" x2="16" y2="15"/>
              <line x1="16" y1="9" x2="22" y2="15"/>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Muted</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Sound On</span>
          </>
        )}
      </div>
    </button>
  );
}
