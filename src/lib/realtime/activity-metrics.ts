import clientPromise from "@/lib/mongodb";
import { eventBus } from "./event-bus";
import { ActivitySnapshot } from "./types";
import { ObjectId } from "mongodb";

class ActivityMetricsManager {
  private isRunning = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastCalculationTime = 0;
  private readonly CALCULATION_DEBOUNCE_MS = 2000; // Recalculate at most once every 2s

  public triggerRecalculation() {
    const now = Date.now();
    const timeSinceLastCalc = now - this.lastCalculationTime;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (timeSinceLastCalc >= this.CALCULATION_DEBOUNCE_MS) {
      this.calculateAndBroadcast().catch(console.error);
    } else {
      this.timeoutId = setTimeout(() => {
        this.calculateAndBroadcast().catch(console.error);
      }, this.CALCULATION_DEBOUNCE_MS - timeSinceLastCalc);
    }
  }

  private async calculateAndBroadcast() {
    this.lastCalculationTime = Date.now();
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayIso = startOfToday.toISOString();

      // 1. Active Waiters: count unique actors performing "order created" in audit_logs in the last 30 minutes
      const activeWaitersLogs = await db
        .collection("audit_logs")
        .distinct("performedBy", {
          action: "order created",
          createdAt: { $gte: thirtyMinutesAgo },
        });
      const activeWaitersCount = activeWaitersLogs.length || 1; // Default to 1 if active shift exists but no orders yet

      // 2. Active Cooks: count unique actors performing order status updates in audit_logs in last 30 mins
      const activeCooksLogs = await db
        .collection("audit_logs")
        .distinct("performedBy", {
          action: { $regex: /order status updated to (COOKING|READY)/ },
          createdAt: { $gte: thirtyMinutesAgo },
        });
      
      // Let's also check active shifts
      const activeShift = await db.collection("shifts").findOne({
        $or: [{ status: "ACTIVE" }, { isActive: true }],
      });
      const activeCooksCount = Math.max(activeCooksLogs.length, activeShift ? 1 : 0);

      // 3. Active Orders: count PENDING + COOKING orders
      const activeOrdersCount = await db
        .collection("orders")
        .countDocuments({ status: { $in: ["PENDING", "COOKING"] } });

      const cookingOrdersCount = await db
        .collection("orders")
        .countDocuments({ status: "COOKING" });

      // 4. Kitchen Pressure: cooking orders vs threshold
      const kitchenPressure = Math.min(Math.round((cookingOrdersCount / 8) * 100), 100);

      // 5. Avg Prep Time & Avg Delivery Time for today
      const todayOrders = await db
        .collection("orders")
        .find({
          createdAt: { $gte: startOfTodayIso },
        })
        .toArray();

      let totalPrepTime = 0;
      let prepCount = 0;
      let totalDeliveryTime = 0;
      let deliveryCount = 0;

      // Table activity tracking
      const tableActivity: Record<number, { count: number; lastActivity: string }> = {};

      todayOrders.forEach((o) => {
        // Prep time: acceptedAt -> readyAt
        if (o.acceptedAt && o.readyAt) {
          const start = new Date(o.acceptedAt).getTime();
          const end = new Date(o.readyAt).getTime();
          totalPrepTime += (end - start) / (1000 * 60);
          prepCount++;
        }

        // Delivery time: readyAt -> completedAt
        if (o.readyAt && o.completedAt) {
          const start = new Date(o.readyAt).getTime();
          const end = new Date(o.completedAt).getTime();
          totalDeliveryTime += (end - start) / (1000 * 60);
          deliveryCount++;
        }

        // Table activity mapping
        if (o.tableNumber && o.status !== "COMPLETED" && o.status !== "CANCELLED") {
          const tableNum = Number(o.tableNumber);
          if (!tableActivity[tableNum]) {
            tableActivity[tableNum] = { count: 0, lastActivity: o.createdAt };
          }
          tableActivity[tableNum].count++;
          if (new Date(o.createdAt).getTime() > new Date(tableActivity[tableNum].lastActivity).getTime()) {
            tableActivity[tableNum].lastActivity = o.createdAt;
          }
        }
      });

      const avgPrepTimeMinutes = prepCount > 0 ? Math.round(totalPrepTime / prepCount) : 0;
      const avgDeliveryTimeMinutes = deliveryCount > 0 ? Math.round(totalDeliveryTime / deliveryCount) : 0;

      // 6. Recent Order Flow Rate: orders created in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const recentFlowRate = await db
        .collection("orders")
        .countDocuments({ createdAt: { $gte: fifteenMinutesAgo } });

      const snapshot: ActivitySnapshot = {
        activeWaitersCount,
        activeCooksCount,
        activeOrdersCount,
        kitchenPressure,
        avgPrepTimeMinutes,
        avgDeliveryTimeMinutes,
        tableActivity,
        recentFlowRate,
      };

      console.log("[ActivityMetrics] Broadasted updated activity metrics snapshot.");
      eventBus.emitImmediate("activity:update", snapshot);
    } catch (err) {
      console.error("[ActivityMetrics] Error calculating live metrics:", err);
    }
  }
}

declare global {
  var _activityMetricsManager: ActivityMetricsManager | undefined;
}

export const activityMetricsManager = global._activityMetricsManager || new ActivityMetricsManager();

if (process.env.NODE_ENV !== "production") {
  global._activityMetricsManager = activityMetricsManager;
}
