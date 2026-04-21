"use client";

import { createOrder } from "@/app/actions/orders";
import { useRouter } from "next/navigation";

export default function CreateOrderModal({
    onClose,
}: {
    onClose: () => void;
}) {
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        const tableNumber = Number(formData.get("tableNumber"));
        if (tableNumber < 1) {
            alert("Table number must be greater than 0");
            return;
        }

        await createOrder(formData);

        router.refresh();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

            {/* Card */}
            <div className="bg-[#111118] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fadeIn">

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            New Order
                        </h2>
                        <p className="text-zinc-400 text-xs">
                            Add order to kitchen queue
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white text-lg transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form action={handleSubmit} className="flex flex-col gap-4">

                    {/* Table */}
                    <div>
                        <label className="text-zinc-400 text-xs">
                            Table Number
                        </label>
                        <input
                            name="tableNumber"
                            type="number"
                            placeholder="e.g. 12"
                            min="1"
                            className="w-full mt-1 bg-zinc-900 border border-zinc-700 
                            p-3 rounded-xl text-white 
                            focus:outline-none focus:border-blue-500 
                            transition"
                            required
                        />
                    </div>

                    {/* Items */}
                    <div>
                        <label className="text-zinc-400 text-xs">
                            Items
                        </label>
                        <textarea
                            name="items"
                            placeholder="Burger x1, Fries x2..."
                            className="w-full mt-1 bg-zinc-900 border border-zinc-700 
                            p-3 rounded-xl h-24 text-white resize-none 
                            focus:outline-none focus:border-blue-500 
                            transition"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">

                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 
                            hover:from-green-500 hover:to-emerald-500 
                            text-white font-medium py-3 rounded-xl 
                            shadow-lg shadow-green-500/20 
                            transition-all"
                        >
                            + Create
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 
                            text-zinc-300 py-3 rounded-xl transition"
                        >
                            Cancel
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}