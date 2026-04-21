// import { getOrderById, updateOrderStatus, deleteOrder } from "../../actions/orders";
// import { notFound } from "next/navigation";

// export default async function OrderDetailsPage({
//     params,
//     }: {
//         params: Promise<{ id: string }>;
//     }) {
//     const { id } = await params;
//     const order = await getOrderById(id);

//     if (!order) return notFound();

//     const nextStatus =
//         order.status === "PENDING"
//         ? "COOKING"
//         : order.status === "COOKING"
//         ? "READY"
//         : null;

//     return (
//         <div className="p-6 max-w-xl">
//         <h1 className="text-2xl font-bold mb-4">
//             Order Details — Table #{order.tableNumber}
//         </h1>
//         <pre>{JSON.stringify(order, null, 2)}</pre>


//         <div className="border p-4 rounded">
//             <p><strong>Items:</strong> {order.items}</p>
//             <p><strong>Status:</strong> {order.status}</p>
//         </div>

//         <div className="flex gap-2 mt-4">
//             {/* Update Status */}
//             {nextStatus && (
//             <form
//                 action={updateOrderStatus.bind(
//                 null,
//                 order._id.toString(),
//                 nextStatus
//                 )}
//             >
//                 <button className="bg-blue-500 text-white px-3 py-1 rounded">
//                 Move to {nextStatus}
//                 </button>
//             </form>
//             )}

//             {/* Delete */}
//             {order.status === "PENDING" && (
//             <form
//                 action={deleteOrder.bind(
//                 null,
//                 order._id.toString(),
//                 order.status
//                 )}
//             >
//                 <button className="bg-red-500 text-white px-3 py-1 rounded">
//                 Delete Order
//                 </button>
//             </form>
//             )}
//         </div>
//         </div>
//     );
// }

import Link from "next/link";
import { getOrderById, updateOrderStatus, deleteOrder } from "../../actions/orders";
import { notFound } from "next/navigation";

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) return notFound();

    const nextStatus =
        order.status === "PENDING"
            ? "COOKING"
            : order.status === "COOKING"
            ? "READY"
            : null;

    const formattedDate = new Date(order.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 flex justify-center">
            <div className="w-full max-w-2xl">

                {/* HEADER */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Kitchen Order
                        </h1>

                        <p className="text-zinc-400 text-sm">
                            Table #{order.tableNumber}
                        </p>

                        <p className="text-zinc-500 text-xs mt-1">
                            Created {formattedDate}
                        </p>
                    </div>

                    <Link
                        href="/orders"
                        className="text-sm bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-2 rounded-lg transition"
                    >
                        ← Back
                    </Link>
                </div>

                {/* CARD */}
                <div className="bg-[#111118] border border-zinc-800 rounded-2xl shadow-xl p-6">

                    {/* ORDER ID */}
                    <div className="mb-5">
                        <p className="text-zinc-500 text-xs uppercase tracking-wide">
                            Order ID
                        </p>
                        <p className="text-zinc-300 text-xs break-all mt-1">
                            {order._id.toString()}
                        </p>
                    </div>

                    {/* STATUS */}
                    <div className="mb-6 p-4 rounded-xl bg-[#0f0f16] border border-zinc-800">

                        <div className="flex justify-between items-center mb-2">
                            <p className="text-zinc-400 text-sm">Status</p>

                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    order.status === "PENDING"
                                        ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                        : order.status === "COOKING"
                                        ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                        : "bg-green-500/10 text-green-300 border border-green-500/20"
                                }`}
                            >
                                {order.status}
                            </span>
                        </div>

                        {/* progress */}
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    order.status === "PENDING"
                                        ? "w-1/3 bg-yellow-400"
                                        : order.status === "COOKING"
                                        ? "w-2/3 bg-blue-400"
                                        : "w-full bg-green-400"
                                }`}
                            />
                        </div>
                    </div>

                    {/* ITEMS */}
                    <div className="mb-6">
                        <p className="text-zinc-500 text-xs uppercase mb-2">
                            Items
                        </p>

                        <div className="bg-[#0f0f16] border border-zinc-800 p-4 rounded-xl text-white">
                            🍔 {order.items}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3">

                        {/* UPDATE */}
                        {nextStatus && (
                            <form
                                action={updateOrderStatus.bind(
                                    null,
                                    order._id.toString(),
                                    nextStatus
                                )}
                            >
                                <button className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 text-white text-sm px-4 py-2 rounded-lg transition">
                                    Move → {nextStatus}
                                </button>
                            </form>
                        )}

                        {/* DELETE */}
                        {order.status === "PENDING" && (
                            <form
                                action={deleteOrder.bind(
                                    null,
                                    order._id.toString(),
                                    order.status
                                )}
                            >
                                <button className="bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/10 text-white text-sm px-4 py-2 rounded-lg transition">
                                    Delete Order
                                </button>
                            </form>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
}