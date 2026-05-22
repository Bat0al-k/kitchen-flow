import { getAllOrders } from "@/app/actions/orders";
import Link from "next/link";
import { calculateAveragePrepTime, calculateAverageDeliveryTime, getPeakHour, getDailyStats } from "@/lib/kpi-utils";
import ExportButton from "@/components/reports/ExportButton";
import ReportsCharts from "@/components/reports/ReportsCharts";
import { getCurrentUser } from "@/app/actions/auth";
import Navbar from "@/components/Navbar";


export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
    const user = await getCurrentUser();
    
    // Fallback security check
    if (!user || user.role !== "ADMIN") {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
                <p className="text-zinc-400">Access Denied. Please log in as Admin.</p>
            </div>
        );
    }

    const allOrders = await getAllOrders();
    const { range: rawRange } = await searchParams;
    
    // Simple range filtering
    const range = rawRange || 'today';
    const today = new Date().toISOString().split('T')[0];
    
    const filteredOrders = allOrders.filter(o => {
        if (range === 'today') return o.createdAt.startsWith(today);
        // For 'all', no filtering needed
        return true;
    });

    const kpis = {
        totalOrders: filteredOrders.length,
        completedOrders: filteredOrders.filter(o => o.status === "COMPLETED").length,
        cancelledOrders: filteredOrders.filter(o => o.status === "CANCELLED").length,
        avgPrepTime: calculateAveragePrepTime(filteredOrders),
        avgDeliveryTime: calculateAverageDeliveryTime(filteredOrders),
        peakHour: getPeakHour(filteredOrders),
        dailyStats: getDailyStats(filteredOrders),
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Global Dynamic Navbar */}
            <Navbar user={user} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Management Reports</h1>
                        <p className="text-zinc-400 text-sm">Business analytics and performance metrics</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                            <Link 
                                href="/reports?range=today" 
                                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${range === 'today' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Today
                            </Link>
                            <Link 
                                href="/reports?range=all" 
                                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${range === 'all' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                All Time
                            </Link>
                        </div>
                    </div>
                </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm font-medium">Total Orders</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-4xl font-bold text-white">{kpis.totalOrders}</p>
                        <span className="text-zinc-600 text-xs mb-1">Generated {range}</span>
                    </div>
                </div>
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm font-medium">Completed / Cancelled</p>
                    <div className="flex items-end justify-between mt-2">
                        <div className="flex gap-3">
                            <p className="text-4xl font-bold text-green-500">{kpis.completedOrders}</p>
                            <p className="text-4xl font-bold text-zinc-700">/</p>
                            <p className="text-4xl font-bold text-red-500">{kpis.cancelledOrders}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm font-medium">Peak Activity Hour</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold text-blue-400">{kpis.peakHour}</p>
                    </div>
                </div>
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm font-medium">Avg Kitchen Prep Time</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-4xl font-bold text-blue-500">{kpis.avgPrepTime}</p>
                    </div>
                </div>
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-sm font-medium">Avg Delivery Time</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-4xl font-bold text-green-500">{kpis.avgDeliveryTime}</p>
                    </div>
                </div>
                <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800 flex items-center justify-center">
                    <ExportButton />
                </div>
            </div>

            {/* VISUAL CHARTS */}
            <ReportsCharts orders={filteredOrders} />

            {/* RECENT ORDERS TABLE */}
            <div className="mt-8 bg-[#111118] rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold">Recent Order History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#181820]">
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Table</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredOrders.slice(0, 10).map((order) => (
                                <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">#{order.tableNumber}</td>
                                    <td className="px-6 py-4 text-zinc-300 text-sm">{order.items}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-sm">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    );

}