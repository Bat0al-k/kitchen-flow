"use client";

import { useRealtimeContext } from "@/lib/realtime/RealtimeContext";

interface ActivityMetricsProps {
  initialKpis: {
    avgPrepTime: string;
    avgDeliveryTime: string;
    dailyStats: {
      total: number;
      completed: number;
    };
  };
}

export default function ActivityMetrics({ initialKpis }: ActivityMetricsProps) {
  const { activitySnapshot } = useRealtimeContext();

  const totalOrders = activitySnapshot?.recentFlowRate !== undefined
    ? initialKpis.dailyStats.total
    : initialKpis.dailyStats.total;

  const avgPrep = activitySnapshot
    ? `${activitySnapshot.avgPrepTimeMinutes} min`
    : initialKpis.avgPrepTime;

  const avgDelivery = activitySnapshot
    ? `${activitySnapshot.avgDeliveryTimeMinutes} min`
    : initialKpis.avgDeliveryTime;

  const activeWaiters = activitySnapshot?.activeWaitersCount ?? 1;
  const activeCooks = activitySnapshot?.activeCooksCount ?? 1;
  const kitchenPressure = activitySnapshot?.kitchenPressure ?? 0;
  const currentLoad = activitySnapshot?.activeOrdersCount ?? 0;

  // Choose color based on pressure
  let pressureColor = "text-emerald-400";
  let pressureBarColor = "bg-emerald-500";
  if (kitchenPressure > 70) {
    pressureColor = "text-rose-400 animate-pulse";
    pressureBarColor = "bg-rose-500";
  } else if (kitchenPressure > 40) {
    pressureColor = "text-amber-400";
    pressureBarColor = "bg-amber-500";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-in fade-in duration-300">
      <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700/60 transition-all">
        <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wide">Active Waiters</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-white">{activeWaiters}</p>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>
      
      <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700/60 transition-all">
        <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wide">Active Cooks</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-blue-400">{activeCooks}</p>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        </div>
      </div>

      <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700/60 transition-all">
        <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wide">Current Load</p>
        <p className="text-2xl font-bold mt-1 text-white">{currentLoad} <span className="text-xs text-zinc-500 font-normal">active</span></p>
      </div>

      <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700/60 transition-all col-span-2 sm:col-span-1">
        <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wide">Kitchen Pressure</p>
        <div className="mt-1">
          <div className="flex justify-between items-baseline mb-1">
            <span className={`text-2xl font-bold ${pressureColor}`}>{kitchenPressure}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${pressureBarColor} transition-all duration-500`} style={{ width: `${kitchenPressure}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700/60 transition-all">
        <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wide">Avg Prep Time</p>
        <p className="text-2xl font-bold mt-1 text-blue-400">{avgPrep}</p>
      </div>
    </div>
  );
}
