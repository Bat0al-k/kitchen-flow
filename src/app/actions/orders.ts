"use server";

import clientPromise from "@/lib/mongodb";
import { Order } from "@/types/order";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getActiveShift } from "./shifts";
import { getCurrentUser } from "./auth";
import { logAction } from "@/lib/audit-log";

export async function createOrder(formData: FormData) {
    const tableNumber = Number(formData.get("tableNumber"));
    if (!tableNumber || tableNumber < 1) {
        throw new Error("Invalid table number");
    }
    const items = String(formData.get("items"));
    if (!items || items.trim() === "") {
        throw new Error("Items cannot be empty");
    }

    const activeShift = await getActiveShift();
    const user = await getCurrentUser();
    const performedBy = user ? `${user.email} (${user.role})` : "WAITER";

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("orders").insertOne({
        tableNumber,
        items,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        shiftId: activeShift?._id,
    });

    await logAction("order created", performedBy, result.insertedId.toString());

    revalidatePath("/orders");
    revalidatePath("/reports");
}

export async function getOrderById(id: string) {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const order = await db.collection("orders").findOne({
        _id: new ObjectId(id),
    });

    if (!order) return null;

    return {
        ...order,
        _id: order._id.toString(),
    } as unknown as Order;
}

export async function getOrders(): Promise<Order[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Active orders only for the main dashboard
    const orders = await db
        .collection("orders")
        .find({ status: { $in: ["PENDING", "COOKING", "READY"] } })
        .sort({ createdAt: -1 })
        .toArray();

    return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        acceptedAt: order.acceptedAt instanceof Date ? order.acceptedAt.toISOString() : order.acceptedAt,
        readyAt: order.readyAt instanceof Date ? order.readyAt.toISOString() : order.readyAt,
        completedAt: order.completedAt instanceof Date ? order.completedAt.toISOString() : order.completedAt,
        cancelledAt: order.cancelledAt instanceof Date ? order.cancelledAt.toISOString() : order.cancelledAt,
    })) as unknown as Order[];
}

export async function getCompletedOrders(): Promise<Order[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Hide archived orders from the completed orders list
    const orders = await db
        .collection("orders")
        .find({ status: "COMPLETED", isArchived: { $ne: true } })
        .sort({ completedAt: -1 })
        .toArray();

    return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        acceptedAt: order.acceptedAt instanceof Date ? order.acceptedAt.toISOString() : order.acceptedAt,
        readyAt: order.readyAt instanceof Date ? order.readyAt.toISOString() : order.readyAt,
        completedAt: order.completedAt instanceof Date ? order.completedAt.toISOString() : order.completedAt,
        cancelledAt: order.cancelledAt instanceof Date ? order.cancelledAt.toISOString() : order.cancelledAt,
    })) as unknown as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const orders = await db
        .collection("orders")
        .find()
        .sort({ createdAt: -1 })
        .toArray();

    return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        acceptedAt: order.acceptedAt instanceof Date ? order.acceptedAt.toISOString() : order.acceptedAt,
        readyAt: order.readyAt instanceof Date ? order.readyAt.toISOString() : order.readyAt,
        completedAt: order.completedAt instanceof Date ? order.completedAt.toISOString() : order.completedAt,
        cancelledAt: order.cancelledAt instanceof Date ? order.cancelledAt.toISOString() : order.cancelledAt,
    })) as unknown as Order[];
}

// export async function updateOrderStatus(id: string, status: Order["status"]) {
//     const user = await getCurrentUser();

//     // Authorization: Waiters (unauthenticated) can only mark READY -> COMPLETED.
//     if (status !== "COMPLETED") {
//         if (!user || (user.role !== "ADMIN" && user.role !== "SHIFT_LEADER")) {
//             throw new Error("Unauthorized: Only shift leaders or admins can modify cooking workflow.");
//         }
//     }

export async function updateOrderStatus(
    id: string,
    status: Order["status"]
): Promise<{ success: true } | { error: string }> {
    const user = await getCurrentUser();
    

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date().toISOString();
    const updateData: Partial<Order> = { status };

    if (status === "COOKING") updateData.acceptedAt = now;
    else if (status === "READY") updateData.readyAt = now;
    else if (status === "COMPLETED") updateData.completedAt = now;
    else if (status === "CANCELLED") updateData.cancelledAt = now;

    await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
    );

    const performedBy = user ? `${user.email} (${user.role})` : "WAITER";
    await logAction(`order status updated to ${status}`, performedBy, id);

    revalidatePath("/orders");
    revalidatePath("/orders/completed");
    revalidatePath("/reports");
}

export async function deleteOrder(id: string, status: Order["status"]) {
    if (status !== "PENDING") return;

    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SHIFT_LEADER")) {
        throw new Error("Unauthorized: Only shift leaders or admins can cancel active orders.");
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                status: "CANCELLED",
                cancelledAt: new Date().toISOString()
            } 
        }
    );

    await logAction("order cancelled (deleted)", `${user.email} (${user.role})`, id);

    revalidatePath("/orders");
    revalidatePath("/reports");
}

export async function archiveOrder(id: string) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        throw new Error("Unauthorized: Only admins can archive completed orders.");
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                isArchived: true,
                archivedAt: new Date().toISOString(),
                archivedBy: user.email
            } 
        }
    );

    await logAction("order archived", `${user.email} (${user.role})`, id);

    revalidatePath("/orders/completed");
    revalidatePath("/reports");
}