"use server";

import clientPromise from "@/lib/mongodb";
import { Shift } from "@/types/shift";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

export async function startShift(shiftName: string) {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Check if there is an active shift
    const activeShift = await db.collection("shifts").findOne({ isActive: true });
    if (activeShift) {
        throw new Error("A shift is already active");
    }

    await db.collection("shifts").insertOne({
        shiftName,
        startedAt: new Date().toISOString(),
        isActive: true,
    });

    revalidatePath("/shifts");
    revalidatePath("/orders");
}

export async function endShift(id: string) {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("shifts").updateOne(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                isActive: false,
                endedAt: new Date().toISOString()
            } 
        }
    );

    revalidatePath("/shifts");
    revalidatePath("/orders");
}

export async function getActiveShift(): Promise<Shift | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const shift = await db.collection("shifts").findOne({ isActive: true });
    if (!shift) return null;

    return {
        ...shift,
        _id: shift._id.toString(),
        startedAt: shift.startedAt instanceof Date ? shift.startedAt.toISOString() : shift.startedAt,
        endedAt: shift.endedAt instanceof Date ? shift.endedAt.toISOString() : shift.endedAt,
    } as unknown as Shift;
}

export async function getAllShifts(): Promise<Shift[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const shifts = await db
        .collection("shifts")
        .find()
        .sort({ startedAt: -1 })
        .toArray();

    return shifts.map(s => ({
        ...s,
        _id: s._id.toString(),
        startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
        endedAt: s.endedAt instanceof Date ? s.endedAt.toISOString() : s.endedAt,
    })) as unknown as Shift[];
}
