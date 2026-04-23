// import OrdersPage from "./orders/page";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center text-center py-32 px-16 bg-white dark:bg-black sm:items-start">
//           {/* Kitchen Flow System */}
//           <OrdersPage/>
//       </main>
//     </div>
//   );
// }

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/orders");
  }, [router]);

  return null;
}