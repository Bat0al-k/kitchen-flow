import StatusBadge from "./StatusBadge";
import Link from "next/link";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import type { Order } from "@/types/order";

export default function OrderCard({ order }: { order: Order }) {
  const nextStatus =
    order.status === "PENDING"
      ? "COOKING"
      : order.status === "COOKING"
      ? "READY"
      : null;

  return (
    <div className="border p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Table #{order.tableNumber}</h2>
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-2 text-gray-600">{order.items}</p>

      <Link
        href={`/orders/${order._id}`}
        className="text-sm underline mt-2 block"
      >
        View Details
      </Link>

      <div className="flex gap-2 mt-4">
        {nextStatus && (
            <form
                action={updateOrderStatus.bind(
                null,
                order._id!.toString(),
                nextStatus
                )}
            >
                <button className={`bg-blue-500 text-white  px-3 py-1 rounded ${
                order.status === "READY" ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={order.status === "READY"}
                >
                    Move → {nextStatus}
                </button>
            </form>
        )}

        {order.status === "PENDING" && (
          <form
            action={deleteOrder.bind(
              null,
              order._id!.toString(),
              order.status
            )}
          >
            <button className="bg-red-500 text-white px-3 py-1 rounded">
              Delete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}