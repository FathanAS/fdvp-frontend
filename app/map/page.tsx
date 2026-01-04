"use client";
import MemberMap from "@/components/MemberMap";
import Navbar from "@/components/Navbar";

export default function MapPage() {
    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light">
            <Navbar />

            <div className="pt-32 pb-8 text-center px-6">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                    Member <span className="text-fdvp-primary">Live Map</span>
                </h1>
                <p className="text-fdvp-text max-w-2xl mx-auto text-lg mb-12">
                    Visualizing our community growth across the Indonesian archipelago.
                </p>

                <div className="max-w-7xl mx-auto">
                    <MemberMap />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-20 text-center text-fdvp-text/60 text-sm mt-12">
                <p>
                    Markers are visualized based on user-provided city/province data.
                    Detailed locations are protected for privacy.
                </p>
            </div>
        </main>
    );
}
