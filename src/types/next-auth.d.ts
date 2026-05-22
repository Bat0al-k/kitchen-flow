import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "ADMIN" | "SHIFT_LEADER";
            shiftType: "MORNING" | "EVENING" | null;
        } & DefaultSession["user"];
    }

    interface User {
        role: "ADMIN" | "SHIFT_LEADER";
        shiftType: "MORNING" | "EVENING" | null;
    }
}
