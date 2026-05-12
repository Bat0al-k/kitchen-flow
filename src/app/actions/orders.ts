"use server";

import clientPromise from "@/lib/mongodb";
import { Order } from "@/types/order";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getActiveShift } from "./shifts";

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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").insertOne({
        tableNumber,
        items,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        shiftId: activeShift?._id,
    });

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

    const orders = await db
        .collection("orders")
        .find({ status: "COMPLETED" })
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

export async function updateOrderStatus(id: string, status: Order["status"]) {
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

    revalidatePath("/orders");
    revalidatePath("/orders/completed");
    revalidatePath("/reports");
}

export async function deleteOrder(id: string, status: Order["status"]) {
    if (status !== "PENDING") return;

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

    revalidatePath("/orders");
    revalidatePath("/reports");
}