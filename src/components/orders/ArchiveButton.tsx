"use client";

import { useTransition } from "react";
import { archiveOrder } from "@/app/actions/orders";

interface ArchiveButtonProps {
    orderId: string;
}

export default function ArchiveButton({ orderId }: ArchiveButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleArchive = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm("Are you sure you want to archive this order? It will be hidden from the Completed Orders view.")) {
            startTransition(async () => {
                await archiveOrder(orderId);
            });
        }
    };

    return (
        <button
            onClick={handleArchive}
            disabled={isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-[#161622] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-200 disabled:opacity-50"
        >
            {isPending ? "Archiving..." : "Archive"}
        </button>
    );
}
