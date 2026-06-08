"use client";

import { useRealtimeContext } from "@/lib/realtime/RealtimeContext";

export default function LiveActivityPanel() {
  const { activitySnapshot } = useRealtimeContext();

  if (!activitySnapshot) {
    return (
      <div className="bg-[#111118] p-5 rounded-2xl border border-zinc-800 text-center text-zinc-500 italic text-sm">
        Waiting for live metrics snapshot...
      </div>
    );
  }

  const {
    kitchenPressure,
    activeOrdersCount,
    avgPrepTimeMinutes,
    tableActivity,
    recentFlowRate,
  } = activitySnapshot;

  // Compile live alerts
  const alerts: string[] = [];
  if (kitchenPressure >= 80) {
    alerts.push("🔥 CRITICAL: High Kitchen Pressure! Delays expected.");
  } else if (kitchenPressure >= 50) {
    alerts.push("⚠️ WARNING: Elevated Kitchen Load.");
  }

  if (avgPrepTimeMinutes > 15) {
    alerts.push(`🕒 SLOW: Avg prep time is currently ${avgPrepTimeMinutes} minutes.`);
  }

  if (activeOrdersCount > 10) {
    alerts.push("🔔 HEAVY: Order queue exceeds 10 items.");
  }

  const activeTables = Object.entries(tableActivity);

  return (
    <div className="bg-[#111118] p-5 rounded-2xl border border-zinc-800 space-y-6">
      <div>
        <h3 className="text-md font-bold text-white mb-1">Live Shift Activity</h3>
        <p className="text-zinc-500 text-xs uppercase tracking-wide">Real-time room diagnostics</p>
      </div>

      {/* Live Alerts Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Alerts</h4>
        {alerts.length === 0 ? (
          <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs px-3 py-2 rounded-xl">
            🟢 Kitchen operations normal. No alerts.
          </div>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`text-xs px-3 py-2 rounded-xl border ${
                  alert.includes("CRITICAL") || alert.includes("SLOW")
                    ? "bg-rose-500/5 border-rose-500/10 text-rose-400"
                    : "bg-amber-500/5 border-amber-500/10 text-amber-400 animate-pulse"
                }`}
              >
                {alert}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Activity Map */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Tables</h4>
        {activeTables.length === 0 ? (
          <p className="text-zinc-600 text-xs italic">No active table orders.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {activeTables.map(([tableNum, info]: [string, any]) => {
              // Highlight tables with multiple orders
              const bgStyle = info.count > 1 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-300";

              return (
                <div
                  key={tableNum}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border ${bgStyle} transition-all`}
                  title={`Table #${tableNum}: ${info.count} active order(s)`}
                >
                  <span className="text-xs font-bold">T#{tableNum}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{info.count} ord</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Traffic metrics */}
      <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs">
        <span className="text-zinc-500">Order rate (last 15m)</span>
        <span className="font-bold text-white">{recentFlowRate} orders</span>
      </div>
    </div>
  );
}
