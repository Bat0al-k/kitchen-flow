"use server";

import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth-crypto";
import { MAX_DEVICES_BY_ROLE } from "@/types/user";

/**
 * Seeds the database with default ADMIN and SHIFT_LEADER users if they do not exist.
 * Migrates existing users to the PIN auth schema when already present.
 */
export async function seedUsers() {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    const adminExists = await users.findOne({ role: "ADMIN" });
    if (adminExists) {
        await users.updateMany(
            { deviceIds: { $exists: false } },
            {
                $set: {
                    deviceIds: [],
                    mustSetPin: false,
                    pinDeliveryPending: false,
                    pinAttempts: 0,
                    requiresAdminReset: false,
                },
            }
        );
        await users.updateMany(
            { role: "ADMIN" },
            { $set: { maxDevices: MAX_DEVICES_BY_ROLE.ADMIN } }
        );
        await users.updateMany(
            { role: "SHIFT_LEADER" },
            { $set: { maxDevices: MAX_DEVICES_BY_ROLE.SHIFT_LEADER } }
        );
        await users.updateMany(
            { pinHash: { $exists: false } },
            { $set: { pinHash: null, isSetup: false } }
        );
        return { message: "Database already seeded (schema migrated)" };
    }

    const defaultUsers = [
        {
            name: "Restaurant Supervisor",
            email: "admin@kitchenflow.com",
            password: hashPassword("admin123"),
            pinHash: null,
            role: "ADMIN",
            shiftType: null,
            deviceIds: [],
            maxDevices: MAX_DEVICES_BY_ROLE.ADMIN,
            isSetup: false,
            mustSetPin: false,
            pinDeliveryPending: false,
            pinAttempts: 0,
            requiresAdminReset: false,
            createdAt: new Date().toISOString(),
        },
        {
            name: "Morning Shift Leader",
            email: "morning@kitchenflow.com",
            password: hashPassword("morning123"),
            pinHash: null,
            role: "SHIFT_LEADER",
            shiftType: "MORNING",
            deviceIds: [],
            maxDevices: MAX_DEVICES_BY_ROLE.SHIFT_LEADER,
            isSetup: false,
            mustSetPin: false,
            pinDeliveryPending: false,
            pinAttempts: 0,
            requiresAdminReset: false,
            createdAt: new Date().toISOString(),
        },
        {
            name: "Evening Shift Leader",
            email: "evening@kitchenflow.com",
            password: hashPassword("evening123"),
            pinHash: null,
            role: "SHIFT_LEADER",
            shiftType: "EVENING",
            deviceIds: [],
            maxDevices: MAX_DEVICES_BY_ROLE.SHIFT_LEADER,
            isSetup: false,
            mustSetPin: false,
            pinDeliveryPending: false,
            pinAttempts: 0,
            requiresAdminReset: false,
            createdAt: new Date().toISOString(),
        },
    ];

    await users.insertMany(defaultUsers);

    return { message: "Database seeded successfully!" };
}
