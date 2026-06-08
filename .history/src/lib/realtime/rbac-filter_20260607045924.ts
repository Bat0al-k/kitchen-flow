import { RealtimeEvent, RealtimeEventType } from "./types";
import { UserRole } from "@/types/user";

export function filterEventForRole(
  event: RealtimeEvent,
  role: UserRole | null
): RealtimeEvent | null {
  const { type } = event;
  // Unauthenticated / Waiter mode
  const isWaiter = !role || (typeof role === "string" && role.toLowerCase() === "waiter");
  if (isWaiter) {
    // Waiters can only view order events (created, status changes, cancelled).
    // They cannot view shift events or live manager activity metrics.
    if (
      type === "order:created" ||
      type === "order:status-changed" ||
      type === "order:cancelled"
    ) {
      return event;
    }
    return null;
  }

  // Shift Leaders and Admins have full access to order updates, shift statuses, and live statistics
  if (role === "SHIFT_LEADER" || role === "ADMIN") {
    return event;
  }

  return null;
}

export function filterBatchForRole(
  batch: RealtimeEvent[],
  role: UserRole | "Waiter" | null
): RealtimeEvent[] {
  return batch
    .map((event) => filterEventForRole(event, role))
    .filter((event): event is RealtimeEvent => event !== null);
}
