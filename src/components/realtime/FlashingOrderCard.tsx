"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types/order";

interface FlashingOrderCardProps {
  order: Order;
  children: React.ReactNode;
}

export default function FlashingOrderCard({ order, children }: FlashingOrderCardProps) {
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    const checkFlashStatus = () => {
      const now = Date.now();
      const createdDiff = now - new Date(order.createdAt).getTime();
      
      // Flash gold for new orders (under 5s old)
      if (order.status === "PENDING" && createdDiff < 5000) {
        setFlashClass("animate-flashGold");
        const timer = setTimeout(() => setFlashClass(""), 5000 - createdDiff);
        return () => clearTimeout(timer);
      }

      // Flash blue for cooking status transitions
      if (order.status === "COOKING" && order.acceptedAt) {
        const acceptedDiff = now - new Date(order.acceptedAt).getTime();
        if (acceptedDiff < 5000) {
          setFlashClass("animate-flashBlue");
          const timer = setTimeout(() => setFlashClass(""), 5000 - acceptedDiff);
          return () => clearTimeout(timer);
        }
      }

      // Flash green for ready status transitions
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

  return (
    <div className={`rounded-xl transition-all duration-500 ${flashClass}`}>
      {children}
    </div>
  );
}
