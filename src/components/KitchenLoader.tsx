export default function KitchenLoader({ showText = false }: { showText?: boolean }) {
    return (
        <div className="flex items-center justify-center min-h-screen">

        <div className="relative flex flex-col items-start gap-5 w-[400px]">

            {/* Pan */}
            <div className="relative flex w-full animate-cooking">

            <div className="absolute left-[10px] w-[40%] h-[10px] rounded-full z-20 animate-flip bg-gradient-to-b from-[rgb(82,33,33)] to-[rgb(200,106,106)]"/>

            <div className="z-30 w-1/2 h-[25px] rounded-b-[40px] bg-gradient-to-t from-cyan-600 to-cyan-400"/>

            <div className="w-[40%] h-[10px] rounded-full bg-gradient-to-b from-zinc-900 to-zinc-500"/>

            </div>

            {/* Shadow */}
            <div className="ml-4 w-[200px] h-[10px] rounded-full blur-[5px] bg-black/20 animate-shadow"/>

            {showText && (
            <p className="mt-8 text-lg text-center font-medium animate-pulse w-full text-gray-400">
                Warming up the grill ...
            </p>
            )}

        </div>
        </div>
    );
}