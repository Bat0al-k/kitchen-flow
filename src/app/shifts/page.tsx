import { getAllShifts, getActiveShift } from "@/app/actions/shifts";
import Link from "next/link";
import { startShift, endShift } from "@/app/actions/shifts";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
    const shifts = await getAllShifts();
    const activeShift = await getActiveShift();

    async function handleStartShift(formData: FormData) {
        "use server";
        const name = formData.get("shiftName") as string;
        await startShift(name);
    }

    async function handleEndShift(formData: FormData) {
        "use server";
        const id = formData.get("shiftId") as string;
        await endShift(id);
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Shift Management</h1>
                    <p className="text-zinc-400 text-sm">Control active work sessions</p>
                </div>
                <Link href="/orders" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    ← Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ACTIVE SHIFT CONTROL */}
                <div className="lg:col-span-1">
                    <div className="bg-[#111118] p-6 rounded-2xl border border-zinc-800 sticky top-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${activeShift ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></span>
                            Current Session
                        </h2>

                        {activeShift ? (
                            <div className="space-y-6">
                                <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
                                    <p className="text-green-500 text-xs font-bold uppercase tracking-wider mb-1">Active Now</p>
                                    <h3 className="text-xl font-bold text-white">{activeShift.shiftName}</h3>
                                    <p className="text-zinc-400 text-sm mt-1">Started at {new Date(activeShift.startedAt).toLocaleTimeString()}</p>
                                </div>

                                <form action={handleEndShift}>
                                    <input type="hidden" name="shiftId" value={activeShift._id} />
                                    <button 
                                        type="submit"
                                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/10"
                                    >
                                        End Shift Session
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <form action={handleStartShift} className="space-y-4">
                                <div>
                                    <label className="block text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Shift Name</label>
                                    <input 
                                        name="shiftName"
                                        type="text" 
                                        placeholder="e.g. Morning Shift, Dinner Rush"
                                        className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/10"
                                >
                                    Start New Shift
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
                                                <td className="px-6 py-4 font-bold text-white">{shift.shiftName}</td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(shift.startedAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">
                                                    {shift.endedAt ? new Date(shift.endedAt).toLocaleString() : <span className="text-green-500 font-bold">Active</span>}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 text-sm">
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
    );
}
