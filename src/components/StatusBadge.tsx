import type { Order } from "@/types/order";

export default function StatusBadge({ status }: { status: Order["status"] }) {
    const colors = {
        PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        COOKING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        READY: "bg-green-500/10 text-green-500 border-green-500/20",
        COMPLETED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${colors[status]}`}>
            {status}
        </span>
    );
}