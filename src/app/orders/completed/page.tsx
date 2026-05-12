import { getCompletedOrders } from "@/app/actions/orders";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CompletedOrdersPage() {
    const orders = await getCompletedOrders();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Completed Orders</h1>
                    <p className="text-zinc-400 text-sm">Historical record of delivered orders</p>
                </div>
                <Link href="/orders" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="bg-[#111118] rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-[#181820]">
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm">Table</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm">Items</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm">Created</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm">Completed</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm">Prep Time</th>
                                <th className="px-6 py-4 text-zinc-400 font-semibold text-sm text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                                        No completed orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const prepTime = order.acceptedAt && order.readyAt 
                                        ? Math.round((new Date(order.readyAt).getTime() - new Date(order.acceptedAt).getTime()) / (1000 * 60)) 
                                        : 'N/A';
                                    
                                    return (
                                        <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-white">#{order.tableNumber}</td>
                                            <td className="px-6 py-4 text-zinc-300 text-sm max-w-md truncate">{order.items}</td>
                                            <td className="px-6 py-4 text-zinc-500 text-sm">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 text-sm">
                                                {order.completedAt ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm">
                                                {prepTime !== 'N/A' ? `${prepTime} min` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <StatusBadge status={order.status} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
