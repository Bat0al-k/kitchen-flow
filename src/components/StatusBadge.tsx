import type { Order } from "@/types/order";

export default function StatusBadge({ status }: { status: Order["status"] }) {
    const colors = {
        PENDING: "bg-yellow-500",
        COOKING: "bg-blue-500",
        READY: "bg-green-500",
    };

    return (
        <span className={`text-white px-2 py-1 rounded text-sm ${colors[status]}`}>
        {status}
        </span>
    );
}