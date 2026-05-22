"use server";

import clientPromise from "@/lib/mongodb";
import { Shift } from "@/types/shift";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { logAction } from "@/lib/audit-log";

export async function startShift(type: "MORNING" | "EVENING") {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SHIFT_LEADER")) {
        throw new Error("Unauthorized: Only shift leaders or admins can start shifts.");
    }

    // Role-specific validation
    if (user.role === "SHIFT_LEADER" && user.shiftType !== type) {
        throw new Error(`As a ${user.shiftType} shift leader, you can only start ${user.shiftType} shifts.`);
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Check if there is already an active shift
    const activeShift = await db.collection("shifts").findOne({ 
        $or: [
            { status: "ACTIVE" },
            { isActive: true }
        ]
    });
    if (activeShift) {
        throw new Error(`A shift is already active (${activeShift.type || activeShift.shiftName})`);
    }

    const result = await db.collection("shifts").insertOne({
        type,
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
        startedBy: user.email,
        // Backward compatibility
        isActive: true,
        shiftName: type === "MORNING" ? "Morning Shift" : "Evening Shift",
    });

    await logAction("shift started", `${user.email} (${user.role})`, result.insertedId.toString());

    revalidatePath("/shifts");
    revalidatePath("/orders");
}

export async function endShift(id: string) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SHIFT_LEADER")) {
        throw new Error("Unauthorized: Only shift leaders or admins can end shifts.");
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const shift = await db.collection("shifts").findOne({ _id: new ObjectId(id) });
    if (!shift) {
        throw new Error("Shift not found");
    }

    // Role-specific validation
    if (user.role === "SHIFT_LEADER" && user.shiftType !== shift.type) {
        throw new Error(`As a ${user.shiftType} shift leader, you can only end ${user.shiftType} shifts.`);
    }

    await db.collection("shifts").updateOne(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                status: "ENDED",
                endedAt: new Date().toISOString(),
                endedBy: user.email,
                // Backward compatibility
                isActive: false,
            } 
        }
    );

    await logAction("shift ended", `${user.email} (${user.role})`, id);

    revalidatePath("/shifts");
    revalidatePath("/orders");
}

export async function getActiveShift(): Promise<Shift | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const shift = await db.collection("shifts").findOne({ 
        $or: [
            { status: "ACTIVE" },
            { isActive: true }
        ]
    });
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
