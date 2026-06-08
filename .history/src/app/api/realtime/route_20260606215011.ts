import { authenticateSse } from "@/lib/realtime/auth-sse";
import { eventBus } from "@/lib/realtime/event-bus";
import { filterEventForRole, filterBatchForRole } from "@/lib/realtime/rbac-filter";
import { RealtimeEvent } from "@/lib/realtime/types";
import { activityMetricsManager } from "@/lib/realtime/activity-metrics";
import "@/lib/realtime/change-stream";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { role } = await authenticateSse();

  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      if (process.env.NODE_ENV !== "production") {
        try {
          console.log(`[SSE] client connected (role=${role})`);
        } catch {}
      }

      const sendEvent = (name: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`));
          if (process.env.NODE_ENV !== "production") {
            try { console.log(`[SSE] sent event '${name}' to client (role=${role})`); } catch {}
          }
        } catch (e) {
          // Stream might be closed
        }
      };

      // Listeners
      const handleBatch = (batch: RealtimeEvent[]) => {
        const filtered = filterBatchForRole(batch, role);
        if (filtered.length > 0) {
          sendEvent("batch", filtered);
        }
      };

      const handleEvent = (event: RealtimeEvent) => {
        const filtered = filterEventForRole(event, role);
        if (filtered) {
          sendEvent("event", filtered);
        }
      };

      // Register listeners
      eventBus.on("batch", handleBatch);
      eventBus.on("event", handleEvent);

      // Heartbeat ping every 30s to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch (e) {
          // Stream might be closed
        }
      }, 30000);

      // Trigger activity metrics update for new connection
      if (role === "ADMIN" || role === "SHIFT_LEADER") {
        activityMetricsManager.triggerRecalculation();
      }

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        eventBus.off("batch", handleBatch);
        eventBus.off("event", handleEvent);
        if (process.env.NODE_ENV !== "production") {
          try { console.log(`[SSE] client disconnected (role=${role})`); } catch {}
        }
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
