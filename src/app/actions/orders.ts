"use server";

import clientPromise from "@/lib/mongodb";
import { Order } from "@/types/order";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

// export async function createOrder(formData: FormData) {

//     const tableNumber = Number(formData.get("tableNumber"));
//     const items = String(formData.get("items"));

//     const client = await clientPromise;
//     const db = client.db(process.env.MONGODB_DB);

//     const newOrder: Order = {
//         tableNumber,
//         items,
//         status: "PENDING",
//         createdAt: new Date(),
//     };

//     await db.collection("orders").insertOne(newOrder);

//     revalidatePath("/orders");
// }

export async function createOrder(formData: FormData) {
    const tableNumber = Number(formData.get("tableNumber"));
    if (!tableNumber || tableNumber < 1) {
        throw new Error("Invalid table number");
    }
    const items = String(formData.get("items"));
    if (!items || items.trim() === "") {
        throw new Error("Items cannot be empty");
    }
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").insertOne({
        tableNumber,
        items,
        status: "PENDING",
        createdAt: new Date(),
    });

    revalidatePath("/orders");
}

export async function getOrderById(id: string) {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const order = await db.collection("orders").findOne({
        _id: new ObjectId(id),
    });
    console.log("ID:", id);
console.log("ORDER:", order);

    return order;
}

export async function getOrders(): Promise<Order[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const orders = await db
        .collection("orders")
        .find()
        .sort({ createdAt: -1 })
        .toArray();

    // return orders as unknown as Order[];
    return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
    })) as unknown as Order[];
}

// export async function updateOrderStatus(id: string, status: Order["status"]) {

//   const client = await clientPromise;
//   const db = client.db(process.env.MONGODB_DB);

//   await db.collection("orders").updateOne(
//     { _id: new ObjectId(id) },
//     { $set: { status } }
//   );

//   revalidatePath("/orders");
// }

export async function updateOrderStatus(id: string, status: Order["status"]) {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    revalidatePath("/orders");
}

export async function deleteOrder(id: string, status: Order["status"]) {
    if (status !== "PENDING") return;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("orders").deleteOne({
        _id: new ObjectId(id),
    });

    revalidatePath("/orders");
}