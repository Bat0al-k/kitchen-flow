import clientPromise from "@/lib/mongodb";

/**
 * Log a management action to the database for security auditing.
 */
export async function logAction(action: string, performedBy: string, targetId?: string) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        await db.collection("audit_logs").insertOne({
            action,
            performedBy,
            targetId,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}
