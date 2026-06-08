import clientPromise from "@/lib/mongodb";
import { eventBus } from "./event-bus";
import { OrderDelta, ShiftDelta } from "./types";
import { Order } from "@/types/order";
import { Shift } from "@/types/shift";
import { activityMetricsManager } from "./activity-metrics";

class MongoChangeStreamManager {
  private isListening = false;
  private changeStream: any = null;

  public async startListening() {
    if (this.isListening) return;

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      console.log("[ChangeStream] Initializing MongoDB Change Stream watcher...");

      // Watch both 'orders' and 'shifts' collections in the database
      this.changeStream = db.watch(
        [
          {
            $match: {
              "ns.coll": { $in: ["orders", "shifts"] },
              operationType: { $in: ["insert", "update", "replace", "delete"] },
            },
          },
        ],
        { fullDocument: "updateLookup" }
      );

      this.changeStream.on("change", (change: any) => {
        try {
          this.handleChange(change);
        } catch (err) {
          console.error("[ChangeStream] Error handling change stream event:", err);
        }
      });

      this.changeStream.on("error", (err: any) => {
        console.error("[ChangeStream] Change stream error:", err);
        this.isListening = false;
        // Attempt to restart listening with backoff
        setTimeout(() => this.startListening(), 5000);
      });

      this.isListening = true;
      console.log("[ChangeStream] Successfully subscribed to MongoDB Change Stream.");
      // Trigger initial metrics calculation
      activityMetricsManager.triggerRecalculation();
    } catch (error) {
      console.error("[ChangeStream] Failed to initialize change stream:", error);
      this.isListening = false;
      setTimeout(() => this.startListening(), 10000);
    }
  }

  private handleChange(change: any) {
    const coll = change.ns?.coll;
    const opType = change.operationType;

    if (coll === "orders") {
      const order = change.fullDocument as Order;
      const orderId = change.documentKey?._id?.toString() || order?._id?.toString() || "";

      if (opType === "insert") {
        const delta: OrderDelta = {
          orderId,
          tableNumber: order.tableNumber,
          items: order.items,
          newStatus: order.status,
          updatedAt: order.createdAt,
        };
        if (process.env.NODE_ENV !== "production") console.log("[ChangeStream] order:created ->", orderId);
        eventBus.emitBatched("order:created", delta);
      } else if (opType === "update" || opType === "replace") {
        const updatedFields = change.updateDescription?.updatedFields || {};
        const newStatus = updatedFields.status || order?.status;
        const prevStatus = change.updateDescription?.removedFields?.includes("status") 
          ? null 
          : (order?.status !== newStatus ? order?.status : null); // Fallback estimate

        if (newStatus) {
          const delta: OrderDelta = {
            orderId,
            tableNumber: order?.tableNumber ?? updatedFields.tableNumber,
            items: order?.items ?? updatedFields.items,
            previousStatus: prevStatus,
            newStatus,
            updatedAt: updatedFields.readyAt || updatedFields.acceptedAt || updatedFields.completedAt || updatedFields.cancelledAt || new Date().toISOString(),
          };

          if (newStatus === "CANCELLED") {
            if (process.env.NODE_ENV !== "production") console.log("[ChangeStream] order:cancelled ->", orderId);
            eventBus.emitBatched("order:cancelled", delta);
          } else {
            if (process.env.NODE_ENV !== "production") console.log("[ChangeStream] order:status-changed ->", orderId, "newStatus=", newStatus);
            eventBus.emitBatched("order:status-changed", delta);
          }
        }
      }
    } else if (coll === "shifts") {
      const shift = change.fullDocument as Shift;
      const shiftId = change.documentKey?._id?.toString() || shift?._id?.toString() || "";

      if (opType === "insert") {
        const delta: ShiftDelta = {
          shiftId,
          type: shift.type,
          status: "ACTIVE",
          startedAt: shift.startedAt,
          startedBy: shift.startedBy,
        };
        if (process.env.NODE_ENV !== "production") console.log("[ChangeStream] shift:started ->", shiftId);
        eventBus.emitImmediate("shift:started", delta);
      } else if (opType === "update" || opType === "replace") {
        const updatedFields = change.updateDescription?.updatedFields || {};
        if (updatedFields.status === "ENDED" || shift?.status === "ENDED") {
          const delta: ShiftDelta = {
            shiftId,
            type: shift?.type || updatedFields.type,
            status: "ENDED",
            startedAt: shift?.startedAt || updatedFields.startedAt,
            endedAt: shift?.endedAt || updatedFields.endedAt,
            startedBy: shift?.startedBy || updatedFields.startedBy,
            endedBy: shift?.endedBy || updatedFields.endedBy,
          };
          if (process.env.NODE_ENV !== "production") console.log("[ChangeStream] shift:ended ->", shiftId);
          eventBus.emitImmediate("shift:ended", delta);
        }
      }
    }
    // Always trigger recalculation on order/shift modifications
    activityMetricsManager.triggerRecalculation();
  }
}

// Global singleton instance
declare global {
  var _mongoChangeStreamManager: MongoChangeStreamManager | undefined;
}

export const changeStreamManager = global._mongoChangeStreamManager || new MongoChangeStreamManager();

if (process.env.NODE_ENV !== "production") {
  global._mongoChangeStreamManager = changeStreamManager;
}

// Trigger listening startup immediately upon server initialization
if (typeof window === "undefined") {
  changeStreamManager.startListening().catch(console.error);
}
