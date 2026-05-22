import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const user = req.auth?.user;

    const isReports = nextUrl.pathname.startsWith("/reports");
    const isShifts = nextUrl.pathname.startsWith("/shifts");
    const isCompleted = nextUrl.pathname.startsWith("/orders/completed");
    const isAdmin = nextUrl.pathname.startsWith("/admin");

    if (isReports || isShifts || isCompleted || isAdmin) {
        if (!isLoggedIn) {
            // Redirect unauthenticated to dashboard and prompt login modal
            const redirectUrl = new URL("/orders", req.url);
            redirectUrl.searchParams.set("showLogin", "true");
            return NextResponse.redirect(redirectUrl);
        }

        if (isReports || isAdmin) {
            if (user?.role !== "ADMIN") {
                // Non-admin trying to access reports -> redirect to dashboard
                return NextResponse.redirect(new URL("/orders", req.url));
            }
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/reports/:path*", 
        "/shifts/:path*", 
        "/orders/completed/:path*", 
        "/admin/:path*"
    ],
};
