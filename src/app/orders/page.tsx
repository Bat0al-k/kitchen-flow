// import Link from "next/link";
// import { getOrders } from "../actions/orders";
// import OrderCard from "@/components/OrderCard";

// export default async function OrdersPage() {
//     const orders = await getOrders();

//     const pending = orders.filter(o => o.status === "PENDING");
//     const cooking = orders.filter(o => o.status === "COOKING");
//     const ready = orders.filter(o => o.status === "READY");

//     return (
//         <>
//         <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
//             <div className="flex justify-between items-center mb-6">
//                 <div>
//                     <h1 className="text-3xl font-bold text-white">
//                         Kitchen Dashboard
//                     </h1>
//                     <p className="text-zinc-400 text-sm">
//                         Manage all incoming orders
//                     </p>
//                 </div>
//                 {/* Button (Moved Here) */}
//                 <Link
//                     href="/orders/new"
//                     className="inline-flex items-center gap-2 
//                     bg-gradient-to-r from-blue-600 to-indigo-600 
//                     hover:from-blue-500 hover:to-indigo-500 
//                     text-white px-4 py-2 rounded-xl 
//                     shadow-lg shadow-blue-500/20 
//                     transition-all duration-200 
//                     border border-blue-400/20"
//                 >
//                     + Create New Order
//                 </Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//                 {/* PENDING */}
//                 <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
//                     <h2 className="text-yellow-300 font-bold mb-3">
//                         🟡 PENDING ({pending.length})
//                     </h2>
//                     {pending.map(order => (
//                         <OrderCard key={order._id?.toString()} order={order} />
//                     ))}
//                 </div>

//                 {/* COOKING */}
//                 <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
//                     <h2 className="text-blue-300 font-bold mb-3">
//                         🔵 COOKING ({cooking.length})
//                     </h2>
//                     {cooking.map(order => (
//                         <OrderCard key={order._id?.toString()} order={order} />
//                     ))}
//                 </div>

//                 {/* READY */}
//                 <div className="bg-[#111118] p-4 rounded-xl border border-zinc-800">
//                     <h2 className="text-green-300 font-bold mb-3">
//                         🟢 READY ({ready.length})
//                     </h2>
//                     {ready.map(order => (
//                         <OrderCard key={order._id?.toString()} order={order} />
//                     ))}
//                 </div>

//             </div>
//         </div>
//         </>
//     );
// }

import { getOrders } from "../actions/orders";
import OrdersClient from "@/components/orders/OrdersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function OrdersPage() {
    await new Promise((res) => setTimeout(res, 1000));

    const orders = await getOrders();

    return <OrdersClient orders={orders} />;
}