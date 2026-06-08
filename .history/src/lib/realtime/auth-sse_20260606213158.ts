import { auth } from "@/auth";
import { UserRole } from "@/types/user";

export interface SseAuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  role: UserRole | "Waiter";
  email: string | null;
}

export async function authenticateSse(): Promise<SseAuthResult> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return {
        isAuthenticated: false,
        userId: null,
        role: null,
        email: null,
      };
    }

    return {
      isAuthenticated: true,
      userId: session.user.id || null,
      role: (session.user.role as UserRole) || null,
      email: session.user.email || null,
    };
  } catch (error) {
    console.error("[SseAuth] Error during SSE authentication:", error);
    return {
      isAuthenticated: false,
      userId: null,
      role: null,
      email: null,
    };
  }
}
