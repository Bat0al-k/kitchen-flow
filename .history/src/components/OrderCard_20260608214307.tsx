"use client";

import StatusBadge from "./StatusBadge";
import Link from "next/link";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import type { Order } from "@/types/order";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    const checkFlashStatus = () => {
      const now = Date.now();
      const createdDiff = now - new Date(order.createdAt).getTime();
      
      if (order.status === "PENDING" && createdDiff < 5000) {
        setFlashClass("animate-flashGold");
        const timer = setTimeout(() => setFlashClass(""), 5000 - createdDiff);
        return () => clearTimeout(timer);
      }

      if (order.status === "COOKING" && order.acceptedAt) {
        const acceptedDiff = now - new Date(order.acceptedAt).getTime();
        if (acceptedDiff < 5000) {
          setFlashClass("animate-flashBlue");
          const timer = setTimeout(() => setFlashClass(""), 5000 - acceptedDiff);
          return () => clearTimeout(timer);
        }
      }

      if (order.status === "READY" && order.readyAt) {
        const readyDiff = now - new Date(order.readyAt).getTime();
        if (readyDiff < 5000) {
          setFlashClass("animate-flashGreen");
          const timer = setTimeout(() => setFlashClass(""), 5000 - readyDiff);
          return () => clearTimeout(timer);
        }
      }

      setFlashClass("");
    };

    checkFlashStatus();
  }, [order.status, order.createdAt, order.acceptedAt, order.readyAt]);

  const nextStatus =
    order.status === "PENDING"
      ? "COOKING"
      : order.status === "COOKING"
      ? "READY"
      : null;

  const handleStatusUpdate = async (status: Order["status"]) => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order._id!.toString(), status);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = async () => {
    setActionError(null);
    startTransition(async () => {
      await deleteOrder(order._id!.toString(), order.status);
      router.refresh();
    });
  };

  return (
    <div className={`bg-[#181820] border p-4 rounded-xl shadow-lg transition-all hover:border-zinc-700 ${flashClass || "border-zinc-800"} ${isPending ? "opacity-50" : ""}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">Table #{order.tableNumber}</h3>
          <p className="text-zinc-500 text-xs">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-[#111118] p-3 rounded-lg border border-zinc-800/50 mb-4">
        <p className="text-zinc-300 text-sm leading-relaxed">{order.items}</p>
      </div>

      {actionError && (
        <p className="text-red-400 text-xs mb-2">{actionError}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {nextStatus && (
            <button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={isPending}
              className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/20 transition-all"
            >
              Start {nextStatus}
            </button>
          )}

          {order.status === "READY" && (
            <button
              onClick={() => handleStatusUpdate("COMPLETED")}
              disabled={isPending}
              className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/20 transition-all"
            >
              Complete
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === "PENDING" && (
            <>
              <button
                onClick={() => handleStatusUpdate("CANCELLED")}
                disabled={isPending}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 transition-all"
              >
                Delete
              </button>
            </>
          )}
          
          <Link
            href={`/orders/${order._id}`}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}