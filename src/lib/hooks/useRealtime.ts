// import { useEffect, useState, useRef } from "react";
// import { RealtimeEvent, OrderDelta, ShiftDelta, ActivitySnapshot } from "../realtime/types";

// export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

// interface UseRealtimeProps {
//   onOrderCreated?: (delta: OrderDelta) => void;
//   onOrderStatusChanged?: (delta: OrderDelta) => void;
//   onOrderCancelled?: (delta: OrderDelta) => void;
//   onShiftStarted?: (delta: ShiftDelta) => void;
//   onShiftEnded?: (delta: ShiftDelta) => void;
//   onActivityUpdate?: (snapshot: ActivitySnapshot) => void;
// }

// export function useRealtime({
//   onOrderCreated,
//   onOrderStatusChanged,
//   onOrderCancelled,
//   onShiftStarted,
//   onShiftEnded,
//   onActivityUpdate,
// }: UseRealtimeProps = {}) {
//   const [status, setStatus] = useState<ConnectionStatus>("disconnected");
//   const [reconnectCount, setReconnectCount] = useState(0);
//   const eventSourceRef = useRef<EventSource | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const baseDelay = 1000;
//   const maxDelay = 30000;

//   useEffect(() => {
//     let active = true;

//     function connect() {
//       if (!active) return;
      
//       if (eventSourceRef.current) {
//         eventSourceRef.current.close();
//       }

//       console.log("[useRealtime] Connecting to SSE real-time updates...");
//       const eventSource = new EventSource("/api/realtime");
//       eventSourceRef.current = eventSource;

//       eventSource.onopen = () => {
//         if (!active) return;
//         console.log("[useRealtime] Connection established.");
//         setStatus("connected");
//         setReconnectCount(0);
//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//           reconnectTimeoutRef.current = null;
//         }
//       };

//       const handleParsedEvent = (event: RealtimeEvent) => {
//         if (!active) return;
//         const { type, payload } = event;

//         switch (type) {
//           case "order:created":
//             onOrderCreated?.(payload as OrderDelta);
//             break;
//           case "order:status-changed":
//             onOrderStatusChanged?.(payload as OrderDelta);
//             break;
//           case "order:cancelled":
//             onOrderCancelled?.(payload as OrderDelta);
//             break;
//           case "shift:started":
//             onShiftStarted?.(payload as ShiftDelta);
//             break;
//           case "shift:ended":
//             onShiftEnded?.(payload as ShiftDelta);
//             break;
//           case "activity:update":
//             onActivityUpdate?.(payload as ActivitySnapshot);
//             break;
//           default:
//             console.warn("[useRealtime] Unknown event type received:", type);
//         }
//       };

//       // Listen for batched events
//       eventSource.addEventListener("batch", (e: MessageEvent) => {
//         try {
//           const events: RealtimeEvent[] = JSON.parse(e.data);
//           events.forEach(handleParsedEvent);
//         } catch (err) {
//           console.error("[useRealtime] Error parsing batch data:", err);
//         }
//       });

//       // Listen for single/immediate events
//       eventSource.addEventListener("event", (e: MessageEvent) => {
//         try {
//           const event: RealtimeEvent = JSON.parse(e.data);
//           handleParsedEvent(event);
//         } catch (err) {
//           console.error("[useRealtime] Error parsing single event data:", err);
//         }
//       });

//       eventSource.onerror = (err) => {
//         if (!active) return;
//         console.warn("[useRealtime] SSE Connection error. Reconnecting...");
//         eventSource.close();
//         setStatus("reconnecting");
        
//         // Exponential backoff reconnect
//         const nextDelay = Math.min(baseDelay * Math.pow(2, reconnectCount), maxDelay);
//         setReconnectCount((prev) => prev + 1);

//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//         }

//         reconnectTimeoutRef.current = setTimeout(() => {
//           connect();
//         }, nextDelay);
//       };
//     }

//     connect();

//     return () => {
//       active = false;
//       if (eventSourceRef.current) {
//         eventSourceRef.current.close();
//       }
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//     };
//   }, [
//     onOrderCreated,
//     onOrderStatusChanged,
//     onOrderCancelled,
//     onShiftStarted,
//     onShiftEnded,
//     onActivityUpdate,
//     reconnectCount,
//   ]);

//   return { status };
// }


import { useEffect, useState, useRef, useCallback } from "react";
import { RealtimeEvent, OrderDelta, ShiftDelta, ActivitySnapshot } from "../realtime/types";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface UseRealtimeProps {
  onOrderCreated?: (delta: OrderDelta) => void;
  onOrderStatusChanged?: (delta: OrderDelta) => void;
  onOrderCancelled?: (delta: OrderDelta) => void;
  onShiftStarted?: (delta: ShiftDelta) => void;
  onShiftEnded?: (delta: ShiftDelta) => void;
  onActivityUpdate?: (snapshot: ActivitySnapshot) => void;
}

export function useRealtime({
  onOrderCreated,
  onOrderStatusChanged,
  onOrderCancelled,
  onShiftStarted,
  onShiftEnded,
  onActivityUpdate,
}: UseRealtimeProps = {}) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0); // ✅ ref بدل state — مش بيسبب re-render أو re-subscription

  // ✅ نحتفظ بأحدث نسخة من كل callback في ref
  // عشان الـ event listeners مش محتاجين يتغيروا كل ما الـ callbacks تتغير
  const onOrderCreatedRef = useRef(onOrderCreated);
  const onOrderStatusChangedRef = useRef(onOrderStatusChanged);
  const onOrderCancelledRef = useRef(onOrderCancelled);
  const onShiftStartedRef = useRef(onShiftStarted);
  const onShiftEndedRef = useRef(onShiftEnded);
  const onActivityUpdateRef = useRef(onActivityUpdate);

  // ✅ نحدث الـ refs كل ما الـ props تتغير من غير ما نعمل re-subscribe
  useEffect(() => { onOrderCreatedRef.current = onOrderCreated; }, [onOrderCreated]);
  useEffect(() => { onOrderStatusChangedRef.current = onOrderStatusChanged; }, [onOrderStatusChanged]);
  useEffect(() => { onOrderCancelledRef.current = onOrderCancelled; }, [onOrderCancelled]);
  useEffect(() => { onShiftStartedRef.current = onShiftStarted; }, [onShiftStarted]);
  useEffect(() => { onShiftEndedRef.current = onShiftEnded; }, [onShiftEnded]);
  useEffect(() => { onActivityUpdateRef.current = onActivityUpdate; }, [onActivityUpdate]);

  const baseDelay = 1000;
  const maxDelay = 30000;

  useEffect(() => {
    let active = true;

    const handleParsedEvent = (event: RealtimeEvent) => {
      if (!active) return;
      const { type, payload } = event;

      // ✅ نستخدم الـ refs عشان دايماً نستدعي أحدث نسخة من الـ callback
      switch (type) {
        case "order:created":
          onOrderCreatedRef.current?.(payload as OrderDelta);
          break;
        case "order:status-changed":
          onOrderStatusChangedRef.current?.(payload as OrderDelta);
          break;
        case "order:cancelled":
          onOrderCancelledRef.current?.(payload as OrderDelta);
          break;
        case "shift:started":
          onShiftStartedRef.current?.(payload as ShiftDelta);
          break;
        case "shift:ended":
          onShiftEndedRef.current?.(payload as ShiftDelta);
          break;
        case "activity:update":
          onActivityUpdateRef.current?.(payload as ActivitySnapshot);
          break;
        default:
          console.warn("[useRealtime] Unknown event type received:", type);
      }
    };

    function connect() {
      if (!active) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log("[useRealtime] Connecting to SSE real-time updates...");
      const eventSource = new EventSource("/api/realtime");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!active) return;
        console.log("[useRealtime] Connection established.");
        setStatus("connected");
        reconnectCountRef.current = 0; // ✅ reset عبر ref من غير re-render
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      // Listen for batched events
      eventSource.addEventListener("batch", (e: MessageEvent) => {
        try {
          const events: RealtimeEvent[] = JSON.parse(e.data);
          events.forEach(handleParsedEvent);
        } catch (err) {
          console.error("[useRealtime] Error parsing batch data:", err);
        }
      });

      // Listen for single/immediate events
      eventSource.addEventListener("event", (e: MessageEvent) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          handleParsedEvent(event);
        } catch (err) {
          console.error("[useRealtime] Error parsing single event data:", err);
        }
      });

      eventSource.onerror = () => {
        if (!active) return;
        console.warn("[useRealtime] SSE Connection error. Reconnecting...");
        eventSource.close();
        setStatus("reconnecting");

        // ✅ Exponential backoff باستخدام ref مش state
        const nextDelay = Math.min(
          baseDelay * Math.pow(2, reconnectCountRef.current),
          maxDelay
        );
        reconnectCountRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, nextDelay);
      };
    }

    connect();

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // ✅ dependency array فاضي — الـ connection بيتعمل مرة واحدة بس

  return { status };
}