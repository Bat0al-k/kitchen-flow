import { getAllShifts, getActiveShift } from "@/app/actions/shifts";
import { startShift, endShift } from "@/app/actions/shifts";
import { getCurrentUser } from "@/app/actions/auth";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
    const user = await getCurrentUser();
    
    // Fallback security check (middleware already protects this, but good practice)
    if (!user) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
                <p className="text-zinc-400">Access Denied. Please log in.</p>
            </div>
        );
    }

    const shifts = await getAllShifts();
    const activeShift = await getActiveShift();

    async function handleStartShift(formData: FormData) {
        "use server";
        const type = formData.get("shiftType") as "MORNING" | "EVENING";
        await startShift(type);
    }

    async function handleEndShift(formData: FormData) {
        "use server";
        const id = formData.get("shiftId") as string;
        await endShift(id);
    }

    // Determine if the current shift leader is allowed to end the active shift
    const canEndActiveShift = 
        user.role === "ADMIN" || 
        (user.role === "SHIFT_LEADER" && activeShift && activeShift.type === user.shiftType);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Global Dynamic Navbar */}
            <Navbar user={user} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Shift Management</h1>
                        <p className="text-zinc-400 text-sm">Control active work sessions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ACTIVE SHIFT CONTROL */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800 sticky top-24">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${activeShift ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></span>
                                Current Session
                            </h2>

                            {activeShift ? (
                                <div className="space-y-6">
                                    <div className={`border p-4 rounded-xl ${
                                        activeShift.type === "MORNING" 
                                            ? "bg-sky-500/5 border-sky-500/20 text-sky-400" 
                                            : "bg-indigo-500/5 border-indigo-500/20 text-indigo-400"
                                    }`}>
                                        <p className="text-xs font-bold uppercase tracking-wider mb-1">
                                            {activeShift.type} SHIFT ACTIVE
                                        </p>
                                        <h3 className="text-xl font-bold text-white">
                                            {activeShift.type === "MORNING" ? "Morning Shift" : "Evening Shift"}
                                        </h3>
                                        <p className="text-zinc-400 text-xs mt-2">
                                            Started at {new Date(activeShift.startedAt).toLocaleTimeString()}
                                        </p>
                                        {activeShift.startedBy && (
                                            <p className="text-zinc-500 text-xs mt-1">
                                                Started by: {activeShift.startedBy}
                                            </p>
                                        )}
                                    </div>

                                    {canEndActiveShift ? (
                                        <form action={handleEndShift}>
                                            <input type="hidden" name="shiftId" value={activeShift._id} />
                                            <button 
                                                type="submit"
                                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                                            >
                                                End Shift Session
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="text-zinc-500 text-xs text-center border border-zinc-800 p-3 rounded-lg bg-zinc-900/30">
                                            🔒 Only {activeShift.type === "MORNING" ? "Morning" : "Evening"} Shift Leader or Admin can end this shift.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form action={handleStartShift} className="space-y-4">
                                    <div>
                                        <label className="block text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                                            Shift Type
                                        </label>
                                        
                                        {user.role === "SHIFT_LEADER" ? (
                                            <div className="bg-[#0a0a0f] border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium">
                                                <input type="hidden" name="shiftType" value={user.shiftType || ""} />
                                                {user.shiftType === "MORNING" ? "Morning Shift Only" : "Evening Shift Only"}
                                            </div>
                                        ) : (
                                            <select 
                                                name="shiftType"
                                                className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                                required
                                            >
                                                <option value="MORNING">Morning Shift</option>
                                                <option value="EVENING">Evening Shift</option>
                                            </select>
                                        )}
                                    </div>
                                    
                                    <button 
                                        type="submit"
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                                    >
                                        Start {user.role === "SHIFT_LEADER" ? (user.shiftType === "MORNING" ? "Morning" : "Evening") : ""} Shift
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* SHIFT HISTORY */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#111118] rounded-2xl border border-zinc-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800">
                                <h2 className="font-bold">Recent Shift History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#181820]">
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Shift Name</th>
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Started By</th>
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Ended By</th>
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Started</th>
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Ended</th>
                                            <th className="px-6 py-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {shifts.map((shift) => {
                                            const duration = shift.endedAt 
                                                ? Math.round((new Date(shift.endedAt).getTime() - new Date(shift.startedAt).getTime()) / (1000 * 60))
                                                : 'Active';

                                            return (
                                                <tr key={shift._id} className="hover:bg-zinc-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-white">
                                                        {shift.type === "MORNING" ? "Morning Shift" : "Evening Shift"}
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                                        {shift.startedBy || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                                        {shift.endedBy || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                                        {new Date(shift.startedAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                                        {shift.endedAt ? new Date(shift.endedAt).toLocaleString() : <span className="text-green-500 font-bold">Active</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                                        {duration === 'Active' ? 'Ongoing' : `${duration} min`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
