import { Order } from "@/types/order";

export type RealtimeEventType = 
  | 'order:created' 
  | 'order:status-changed' 
  | 'order:cancelled'
  | 'shift:started' 
  | 'shift:ended'
  | 'activity:update';

export interface OrderDelta {
  orderId: string;
  tableNumber: number;
  items: string;
  previousStatus?: Order["status"] | null;
  newStatus: Order["status"];
  updatedAt: string;
}

export interface ShiftDelta {
  shiftId: string;
  type: "MORNING" | "EVENING";
  status: "ACTIVE" | "ENDED";
  startedAt: string;
  endedAt?: string;
  startedBy: string;
  endedBy?: string;
}

export interface ActivitySnapshot {
  activeWaitersCount: number;
  activeCooksCount: number;
  activeOrdersCount: number;
  kitchenPressure: number; // 0 to 100
  avgPrepTimeMinutes: number;
  avgDeliveryTimeMinutes: number;
  tableActivity: Record<number, { count: number; lastActivity: string }>;
  recentFlowRate: number; // Orders in last 15 mins
}

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: OrderDelta | ShiftDelta | ActivitySnapshot;
  timestamp: number;
}
