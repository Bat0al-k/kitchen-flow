import { EventEmitter } from "events";
import { RealtimeEvent, RealtimeEventType } from "./types";

class RealtimeEventBus extends EventEmitter {
  private batch: RealtimeEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY_MS = 300;

  constructor() {
    super();
    // Increase listener limit in case of many concurrent clients
    this.setMaxListeners(200);
  }

  /**
   * Emit an event immediately without batching (useful for shifts or high-priority events if any)
   */
  public emitImmediate(type: RealtimeEventType, payload: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log(`[event-bus] emitImmediate -> ${type}`, payload && payload.orderId ? { orderId: (payload as any).orderId } : payload && payload.shiftId ? { shiftId: (payload as any).shiftId } : undefined);
      } catch {}
    }
    this.emit("event", event);
  }

  /**
   * Queue an event for batching. Debounces updates to the same order.
   */
  public emitBatched(type: RealtimeEventType, payload: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    // Filter out previous events in the batch for the same entity if applicable.
    // For example, if we get multiple updates for the same order, keep only the latest.
    if (type.startsWith("order:") && payload.orderId) {
      this.batch = this.batch.filter(
        (e) => !(e.type.startsWith("order:") && (e.payload as  ).orderId === payload.orderId)
      );
    } else if (type.startsWith("shift:") && payload.shiftId) {
      this.batch = this.batch.filter(
        (e) => !(e.type.startsWith("shift:") && (e.payload as any).shiftId === payload.shiftId)
      );
    }

    this.batch.push(event);

    if (process.env.NODE_ENV !== "production") {
      try {
        console.log(`[event-bus] queued batched -> ${type}`, payload && payload.orderId ? { orderId: (payload as any).orderId } : undefined);
      } catch {}
    }

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch();
      }, this.BATCH_DELAY_MS);
    }
  }

  private flushBatch() {
    this.batchTimeout = null;
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    if (process.env.NODE_ENV !== "production") {
      try {
        console.log(`[event-bus] flushBatch -> count=${currentBatch.length}`);
      } catch {}
    }
    // Emit the batch as a special event
    this.emit("batch", currentBatch);
  }
}

// Global singleton instance
declare global {
  var _realtimeEventBus: RealtimeEventBus | undefined;
}

export const eventBus = global._realtimeEventBus || new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  global._realtimeEventBus = eventBus;
}
