import { Order } from "@/types/order";

export function calculateAveragePrepTime(orders: Order[]): string {
    const timedOrders = orders.filter(o => o.acceptedAt && o.readyAt);
    if (timedOrders.length === 0) return "0 min";

    const totalMinutes = timedOrders.reduce((acc, o) => {
        const start = new Date(o.acceptedAt!).getTime();
        const end = new Date(o.readyAt!).getTime();
        return acc + (end - start) / (1000 * 60);
    }, 0);

    return `${Math.round(totalMinutes / timedOrders.length)} min`;
}

export function calculateAverageDeliveryTime(orders: Order[]): string {
    const timedOrders = orders.filter(o => o.readyAt && o.completedAt);
    if (timedOrders.length === 0) return "0 min";

    const totalMinutes = timedOrders.reduce((acc, o) => {
        const start = new Date(o.readyAt!).getTime();
        const end = new Date(o.completedAt!).getTime();
        return acc + (end - start) / (1000 * 60);
    }, 0);

    return `${Math.round(totalMinutes / timedOrders.length)} min`;
}

export function getPeakHour(orders: Order[]): string {
    if (orders.length === 0) return "N/A";

    const hours = orders.map(o => new Date(o.createdAt).getHours());
    const counts: Record<number, number> = {};
    
    hours.forEach(h => counts[h] = (counts[h] || 0) + 1);
    
    const peakHour = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    
    const hour = parseInt(peakHour);
    return `${hour}:00 - ${hour + 1}:00`;
}

export function getDailyStats(orders: Order[]) {
    // الحصول على تاريخ اليوم بالتوقيت المحلي بصيغة YYYY-MM-DD لضمان الدقة
    const today = new Date().toLocaleDateString('en-CA'); 
    
    const todayOrders = orders.filter(o => {
        // تحويل تاريخ الطلب لنفس الصيغة المحلية للمقارنة الصحيحة
        const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
        return orderDate === today;
    });

    return {
        total: todayOrders.length,
        completed: todayOrders.filter(o => o.status === "COMPLETED").length,
        cancelled: todayOrders.filter(o => o.status === "CANCELLED").length,
        pending: todayOrders.filter(o => o.status === "PENDING").length,
    };
}
