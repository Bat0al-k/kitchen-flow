/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useState } from "react";
// import CreateOrderModal from "@/components/CreateOrderModal";
// import OrderCard from "@/components/OrderCard";

// export default function OrdersClient({ orders }: any) {
//     const [open, setOpen] = useState(false);

//     const pending = orders.filter((o: any) => o.status === "PENDING");
//     const cooking = orders.filter((o: any) => o.status === "COOKING");
//     const ready = orders.filter((o: any) => o.status === "READY");

//     return (
//         <div className="min-h-screen bg-[#0a0a0f] text-white p-6">

//             {/* HEADER */}
//             <div className="flex justify-between items-center mb-6">

//                 <div>
//                     <h1 className="text-3xl font-bold">
//                         Kitchen Dashboard
//                     </h1>
//                     <p className="text-zinc-400 text-sm">
//                         Manage incoming orders
//                     </p>
//                 </div>

//                 <button
//                     onClick={() => setOpen(true)}
//                     className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-xl"
//                 >
//                     + Create Order
//                 </button>

//             </div>

//             {/* KANBAN */}
//             <div className="grid grid-cols-3 gap-4">

//                 <div>{pending.map((o: any) => <OrderCard key={o._id} order={o} />)}</div>
//                 <div>{cooking.map((o: any) => <OrderCard key={o._id} order={o} />)}</div>
//                 <div>{ready.map((o: any) => <OrderCard key={o._id} order={o} />)}</div>

//             </div>

//             {/* MODAL */}
//             {open && (
//                 <CreateOrderModal onClose={() => setOpen(false)} />
//             )}

//         </div>
//     );
// }

"use client";

import { useState } from "react";
import CreateOrderModal from "@/components/CreateOrderModal";
import OrderCard from "@/components/OrderCard";
import Link from "next/link";

export default function OrdersClient({ orders, kpis }: any) {
    const [open, setOpen] = useState(false);

    const pending = orders.filter((o: any) => o.status === "PENDING");
    const cooking = orders.filter((o: any) => o.status === "COOKING");
    const ready = orders.filter((o: any) => o.status === "READY");

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Kitchen Dashboard</h1>
                    <p className="text-zinc-400 text-sm">Manage all incoming orders</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/shifts" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-3 py-2">
                        Shifts
                    </Link>
                    <Link href="/orders/completed" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-3 py-2">
                        Completed
                    </Link>
                    <Link href="/reports" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-3 py-2">
                        Reports
                    </Link>
                    <button
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 border border-blue-400/20"
                    >
                        + Create Order
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-semibold">Orders Today</p>
                    <p className="text-2xl font-bold mt-1 text-white">{kpis.dailyStats.total}</p>
                </div>
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-semibold">Avg Prep Time</p>
                    <p className="text-2xl font-bold mt-1 text-blue-400">{kpis.avgPrepTime}</p>
                </div>
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-semibold">Avg Delivery</p>
                    <p className="text-2xl font-bold mt-1 text-green-400">{kpis.avgDeliveryTime}</p>
                </div>
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-semibold">Completed</p>
                    <p className="text-2xl font-bold mt-1 text-zinc-300">{kpis.dailyStats.completed}</p>
                </div>
            </div>

            {/* KANBAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PENDING */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-yellow-300 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            PENDING
                        </h2>
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded-full border border-yellow-500/20">
                            {pending.length}
                        </span>
                    </div>
                    <div className="bg-[#0e0e15] p-3 rounded-2xl border border-zinc-800/50 min-h-[500px] flex flex-col gap-3">
                        {pending.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                                No pending orders
                            </div>
                        ) : (
                            pending.map((order: any) => <OrderCard key={order._id?.toString()} order={order} />)
                        )}
                    </div>
                </div>

                {/* COOKING */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-blue-300 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            COOKING
                        </h2>
                        <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-0.5 rounded-full border border-blue-500/20">
                            {cooking.length}
                        </span>
                    </div>
                    <div className="bg-[#0e0e15] p-3 rounded-2xl border border-zinc-800/50 min-h-[500px] flex flex-col gap-3">
                        {cooking.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                                Kitchen is idle
                            </div>
                        ) : (
                            cooking.map((order: any) => <OrderCard key={order._id?.toString()} order={order} />)
                        )}
                    </div>
                </div>

                {/* READY */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-green-300 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            READY
                        </h2>
                        <span className="bg-green-500/10 text-green-500 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
                            {ready.length}
                        </span>
                    </div>
                    <div className="bg-[#0e0e15] p-3 rounded-2xl border border-zinc-800/50 min-h-[500px] flex flex-col gap-3">
                        {ready.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                                No orders ready
                            </div>
                        ) : (
                            ready.map((order: any) => <OrderCard key={order._id?.toString()} order={order} />)
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {open && <CreateOrderModal onClose={() => setOpen(false)} />}
        </div>
    );
}