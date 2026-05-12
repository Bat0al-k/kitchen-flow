export type Order = {
    _id?: string;
    tableNumber: number;
    items: string;
    status: "PENDING" | "COOKING" | "READY" | "COMPLETED" | "CANCELLED";
    createdAt: string;
    acceptedAt?: string;
    readyAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    shiftId?: string;
};