import { getCompletedOrders } from "@/app/actions/orders";
import { getCurrentUser } from "@/app/actions/auth";
import StatusBadge from "@/components/StatusBadge";
import Navbar from "@/components/Navbar";
import ArchiveButton from "@/components/orders/ArchiveButton";

export const dynamic = "force-dynamic";

export default async function CompletedOrdersPage() {
    const user = await getCurrentUser();
    
    // Fallback security check (middleware protects this)
    if (!user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
                <p className="text-zinc-400">Access Denied. Please log in.</p>
            </div>
        );
    }

    const orders = await getCompletedOrders();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Global Dynamic Navbar */}
            <Navbar user={user} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Completed Orders</h1>
                        <p className="text-zinc-400 text-sm">Historical record of delivered orders</p>
                    </div>
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
                                    <th className="px-6 py-4 text-zinc-400 font-semibold text-sm text-right">Actions</th>
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
                                                    <div className="flex items-center justify-end gap-3">
                                                        <StatusBadge status={order.status} />
                                                        {user.role === "ADMIN" && order._id && (
                                                            <ArchiveButton orderId={order._id} />
                                                        )}
                                                    </div>
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
        </div>
    );
}
