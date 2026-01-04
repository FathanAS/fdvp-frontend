"use client";
import Navbar from "@/components/Navbar";
import { Code2, Users, Rocket, Globe2, Heart, Target } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
                    <div className="absolute top-10 right-10 w-96 h-96 bg-fdvp-primary/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-72 h-72 bg-fdvp-accent/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-fdvp-primary/10 text-fdvp-primary text-xs font-bold tracking-wider mb-6 border border-fdvp-primary/20">
                        EST. 2024
                    </span>
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                        We Are <span className="text-fdvp-primary">FDVP</span>. <br />
                        <span className="text-fdvp-text-light/80">Builders of Tomorrow.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-fdvp-text max-w-2xl mx-auto leading-relaxed">
                        Future Digital Visionaries (FDVP) is Indonesia's fastest-growing ecosystem for developers, designers, and tech enthusiasts. We bridge the gap between learning and professional excellence.
                    </p>
                </div>
            </section>

            {/* MISSION GRID */}
            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-fdvp-card p-8 rounded-3xl border border-fdvp-text/10 hover:border-fdvp-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-fdvp-primary/10 rounded-xl flex items-center justify-center text-fdvp-primary mb-6 group-hover:scale-110 transition-transform">
                            <Rocket size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                        <p className="text-fdvp-text text-sm leading-relaxed">
                            To empower 10,000+ developers with world-class skills, mentorship, and opportunities, fostering a digital revolution in Indonesia.
                        </p>
                    </div>

                    <div className="bg-fdvp-card p-8 rounded-3xl border border-fdvp-text/10 hover:border-fdvp-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Community First</h3>
                        <p className="text-fdvp-text text-sm leading-relaxed">
                            We believe in the power of collaboration. Our platform connects seniors with juniors, creating a cycle of endless learning and support.
                        </p>
                    </div>

                    <div className="bg-fdvp-card p-8 rounded-3xl border border-fdvp-text/10 hover:border-fdvp-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                            <Globe2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Global Standard</h3>
                        <p className="text-fdvp-text text-sm leading-relaxed">
                            Adopting bleeding-edge technologies and best practices to ensure our members are ready for the global competitive market.
                        </p>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-20 bg-fdvp-card/50 border-y border-fdvp-text/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-fdvp-primary mb-2">500+</div>
                            <div className="text-xs uppercase tracking-widest text-fdvp-text">Active Members</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-fdvp-accent mb-2">50+</div>
                            <div className="text-xs uppercase tracking-widest text-fdvp-text">Projects Shipped</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-pink-500 mb-2">24/7</div>
                            <div className="text-xs uppercase tracking-widest text-fdvp-text">Support</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-500 mb-2">38</div>
                            <div className="text-xs uppercase tracking-widest text-fdvp-text">Provinces</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* VISION STORY */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-fdvp-primary to-transparent opacity-20 rounded-2xl md:translate-x-4 md:translate-y-4"></div>
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                alt="Team collaboration"
                                className="rounded-2xl shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-6">Built by Developers, <br />For Developers</h2>
                        <div className="space-y-4 text-fdvp-text">
                            <p>
                                Started in a small discord server, FDVP has grown into a nationwide movement. We recognized a gap in the industry: talented individuals lacked the right mentorship and community to thrive.
                            </p>
                            <p>
                                Today, we are proud to host workshops, hackathons, and coffee chats that bridge digital divides. Whether you are coding your first "Hello World" or architecting microservices, you have a home here.
                            </p>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <a href="/register" className="px-6 py-3 bg-fdvp-primary text-white rounded-xl font-bold hover:brightness-110 transition-all">
                                Join the Movement
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
