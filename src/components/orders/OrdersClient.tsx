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

export default function OrdersClient({ orders }: any) {
    const [open, setOpen] = useState(false);

    const pending = orders.filter((o: any) => o.status === "PENDING");
    const cooking = orders.filter((o: any) => o.status === "COOKING");
    const ready = orders.filter((o: any) => o.status === "READY");

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Kitchen Dashboard
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        Manage all incoming orders
                    </p>
                </div>

                {/* نفس ستايل اللينك بس بقى button */}
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    hover:from-blue-500 hover:to-indigo-500 
                    text-white px-4 py-2 rounded-xl 
                    shadow-lg shadow-blue-500/20 
                    transition-all duration-200 
                    border border-blue-400/20"
                >
                    + Create New Order
                </button>
            </div>

            {/* KANBAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* PENDING */}
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <h2 className="text-yellow-300 font-bold mb-3">
                        🟡 PENDING ({pending.length})
                    </h2>
                    {pending.map((order: any) => (
                        <OrderCard key={order._id?.toString()} order={order} />
                    ))}
                </div>

                {/* COOKING */}
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <h2 className="text-blue-300 font-bold mb-3">
                        🔵 COOKING ({cooking.length})
                    </h2>
                    {cooking.map((order: any) => (
                        <OrderCard key={order._id?.toString()} order={order} />
                    ))}
                </div>

                {/* READY */}
                <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
                    <h2 className="text-green-300 font-bold mb-3">
                        🟢 READY ({ready.length})
                    </h2>
                    {ready.map((order: any) => (
                        <OrderCard key={order._id?.toString()} order={order} />
                    ))}
                </div>

            </div>

            {/* MODAL */}
            {open && (
                <CreateOrderModal onClose={() => setOpen(false)} />
            )}

        </div>
    );
}