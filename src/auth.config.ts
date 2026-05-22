import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    secret: process.env.AUTH_SECRET,
    providers: [], // Stub providers array, credentials will be appended in auth.ts
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shiftType = user.shiftType;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.shiftType = token.shiftType as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/orders", // Redirect to dashboard to open login modal instead of default signin page
    },
    trustHost: true,
} satisfies NextAuthConfig;
