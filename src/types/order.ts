export type Order = {
    _id?: string;
    tableNumber: number;
    items: string;
    status: "PENDING" | "COOKING" | "READY";
    createdAt: Date;
};