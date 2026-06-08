
"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useRealtime } from "../hooks/useRealtime";
import { useNotificationSound } from "../hooks/useNotificationSound";
import { OrderDelta, ShiftDelta, ActivitySnapshot } from "./types";
import { UserRole } from "@/types/user";

interface RealtimeContextType {
  status: "connected" | "reconnecting" | "disconnected";
  latestOrderCreated: OrderDelta | null;
  latestOrderStatusChanged: OrderDelta | null;
  latestOrderCancelled: OrderDelta | null;
  latestShiftStarted: ShiftDelta | null;
  latestShiftEnded: ShiftDelta | null;
  activitySnapshot: ActivitySnapshot | null;
  isMuted: boolean;
  toggleMute: () => void;
  toasts: { id: string; message: string; type: "info" | "success" | "warning" }[];
  removeToast: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeContext must be used within a RealtimeProvider");
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
  user: { role: UserRole | null } | null;
}

export function RealtimeProvider({ children, user }: RealtimeProviderProps) {
  const [latestOrderCreated, setLatestOrderCreated] = useState<OrderDelta | null>(null);
  const [latestOrderStatusChanged, setLatestOrderStatusChanged] = useState<OrderDelta | null>(null);
  const [latestOrderCancelled, setLatestOrderCancelled] = useState<OrderDelta | null>(null);
  const [latestShiftStarted, setLatestShiftStarted] = useState<ShiftDelta | null>(null);
  const [latestShiftEnded, setLatestShiftEnded] = useState<ShiftDelta | null>(null);
  const [activitySnapshot, setActivitySnapshot] = useState<ActivitySnapshot | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "info" | "success" | "warning" }[]>([]);

  const { isMuted, toggleMute, playNewOrderSound, playOrderReadySound } = useNotificationSound();

  // ✅ نحتفظ بـ user في ref عشان الـ callbacks مش محتاجة تتغير كل ما user يتغير
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ✅ removeToast بـ useCallback عشان addToast تقدر تعتمد عليها بأمان
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ✅ addToast بـ useCallback مع removeToast في deps
  const addToast = useCallback(
    (message: string, type: "info" | "success" | "warning" = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  // ✅ كل الـ event handlers بـ useCallback عشان مش يتغيروا كل render
  // ونستخدم userRef بدل user مباشرة عشان نتجنب إضافته للـ deps

  const onOrderCreated = useCallback(
    ( delta: OrderDelta) => {
      setLatestOrderCreated(delta);
      addToast(`🆕 New Order: Table #${delta.tableNumber}`, "info");
      if (userRef.current?.role === "SHIFT_LEADER" || userRef.current?.role === "ADMIN" ||) {
        playNewOrderSound();
      }
    },
    [addToast, playNewOrderSound]
  );

  const onOrderStatusChanged = useCallback(
    (delta: OrderDelta) => {
      setLatestOrderStatusChanged(delta);
      if (delta.newStatus === "READY") {
        addToast(`✅ Order Ready: Table #${delta.tableNumber}`, "success");
        if (!userRef.current) {
          playOrderReadySound();
        }
      } else {
        addToast(`🔄 Order #${delta.orderId.substring(18)} status is now ${delta.newStatus}`, "info");
      }
    },
    [addToast, playOrderReadySound]
  );

  const onOrderCancelled = useCallback(
    (delta: OrderDelta) => {
      setLatestOrderCancelled(delta);
      addToast(`⚠️ Order Cancelled: Table #${delta.tableNumber}`, "warning");
    },
    [addToast]
  );

  const onShiftStarted = useCallback(
    (delta: ShiftDelta) => {
      setLatestShiftStarted(delta);
      addToast(`🟢 Shift Started: ${delta.type} Shift`, "info");
    },
    [addToast]
  );

  const onShiftEnded = useCallback(
    (delta: ShiftDelta) => {
      setLatestShiftEnded(delta);
      addToast(`🔴 Shift Ended: ${delta.type} Shift`, "warning");
    },
    [addToast]
  );

  const onActivityUpdate = useCallback((snapshot: ActivitySnapshot) => {
    setActivitySnapshot(snapshot);
  }, []);

  // ✅ الآن useRealtime بياخد callbacks ثابتة — مش بتتغير كل render
  const { status } = useRealtime({
    onOrderCreated,
    onOrderStatusChanged,
    onOrderCancelled,
    onShiftStarted,
    onShiftEnded,
    onActivityUpdate,
  });

  return (
    <RealtimeContext.Provider
      value={{
        status,
        latestOrderCreated,
        latestOrderStatusChanged,
        latestOrderCancelled,
        latestShiftStarted,
        latestShiftEnded,
        activitySnapshot,
        isMuted,
        toggleMute,
        toasts,
        removeToast,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
