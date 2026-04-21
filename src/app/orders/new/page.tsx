import { createOrder } from "@/app/actions/orders";
import { redirect } from "next/navigation";

export default function NewOrderPage() {
    async function action(formData: FormData) {
        "use server";

        await createOrder(formData);

        redirect("/orders");
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">

            <div className="w-full max-w-md">

                {/* Header */}
                <h1 className="text-3xl font-bold mb-2">
                    Create New Order
                </h1>
                <p className="text-zinc-400 text-sm mb-6">
                    Add a new kitchen order to the system
                </p>

                {/* Card */}
                <div className="bg-[#111118] border border-zinc-800 rounded-2xl shadow-xl p-6">

                    <form action={action} className="flex flex-col gap-4">

                        {/* Table Number */}
                        <div>
                            <label className="text-zinc-400 text-sm">
                                Table Number
                            </label>
                            <input
                                name="tableNumber"
                                type="number"
                                placeholder="e.g. 12"
                                className="w-full mt-1 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 transition"
                                required
                            />
                        </div>

                        {/* Items */}
                        <div>
                            <label className="text-zinc-400 text-sm">
                                Items
                            </label>
                            <textarea
                                name="items"
                                placeholder="e.g. Burger x1, Fries x2, Cola"
                                className="w-full mt-1 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl h-28 resize-none focus:outline-none focus:border-blue-500 transition"
                                required
                            />
                        </div>

                        {/* Button */}
                        <button
                            className="bg-gradient-to-r from-green-600 to-emerald-600 
                            hover:from-green-500 hover:to-emerald-500 
                            text-white font-medium p-3 rounded-xl 
                            shadow-lg shadow-green-500/20 
                            transition-all duration-200"
                        >
                            + Create Order
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}