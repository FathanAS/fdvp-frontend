"use client";
import Navbar from "@/components/Navbar";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ShopPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 bg-fdvp-primary/10 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-fdvp-primary/20 rounded-full animate-ping opacity-20"></div>
                    <ShoppingBag size={64} className="text-fdvp-primary" />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                    Official <span className="text-fdvp-primary">Store</span>
                </h1>

                <p className="text-xl text-fdvp-text max-w-md mb-8">
                    Exclusive merchandise, digital assets, and developer gear are coming soon. Stay tuned!
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-8 py-3 bg-fdvp-card border border-fdvp-text/10 hover:border-fdvp-primary hover:text-fdvp-primary transition-all rounded-full font-bold group"
                >
                    Back to Home <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </main>
    );
}
