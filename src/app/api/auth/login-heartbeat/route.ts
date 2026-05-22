import { NextRequest, NextResponse } from "next/server";
import { updateLoginHeartbeat } from "@/lib/auth-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, step } = body as { userId?: string; step?: string };
        if (!userId || !step) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }
        const result = await updateLoginHeartbeat(userId, step);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
