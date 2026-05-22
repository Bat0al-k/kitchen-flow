import { NextRequest, NextResponse } from "next/server";
import { pollPinReveal } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await pollPinReveal(userId);
    if (!result.available) {
        return NextResponse.json({ available: false });
    }

    return NextResponse.json({
        available: true,
        pin: result.pin,
        secondsRemaining: result.secondsRemaining,
    });
}
