import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminAuthPanel from "@/components/admin/AdminAuthPanel";

export default async function AdminPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/orders?showLogin=true");
    }
    if (session.user.role !== "ADMIN") {
        redirect("/orders");
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <Navbar user={session.user} />
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Security Admin</h1>
                <p className="text-zinc-400 text-sm mb-8">
                    PIN resets, device binding, and account unlocks
                </p>
                <AdminAuthPanel />
            </div>
        </div>
    );
}
