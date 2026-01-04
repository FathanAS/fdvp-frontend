"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/visitors`)
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(err => console.error("Failed to count visitor:", err));
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-fdvp-bg selection:bg-fdvp-primary/30">

      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 z-0">
        {/* Background Image - Visible but integrated */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-[2px] scale-105"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-fdvp-bg/80 via-fdvp-bg/50 to-fdvp-bg pointer-events-none"></div>

        {/* Gradient Mesh / Blobs - Softer & Friendlier */}
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-fdvp-primary/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[20%] w-80 h-80 bg-fdvp-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
        </div>

        {/* Glass Overlay Texture */}
        <div className="absolute inset-0 bg-fdvp-bg/40 backdrop-blur-[1px]"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center">

        {/* LOGO - Floating Effect */}
        <div className="mb-8 md:mb-12 relative animate-in zoom-in fade-in duration-1000 slide-in-from-bottom-10">
          <div className="absolute -inset-4 bg-fdvp-primary/20 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          {/* Light Mode Logo */}
          <img
            src="/images/logo-fdvp-black.png"
            alt="FDVP Logo"
            className="relative w-32 md:w-64 h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out dark:hidden block"
          />
          {/* Dark Mode Logo */}
          <img
            src="/images/logo-fdvp-white.png"
            alt="FDVP Logo"
            className="relative w-32 md:w-64 h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out hidden dark:block"
          />
        </div>

        {/* TEXT CONTENT - Minimalist & Readable */}
        <div className="max-w-4xl space-y-4 md:space-y-6 mb-8 md:mb-12">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-fdvp-text-light leading-tight animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-100">
            {t.home.heroTitle}
          </h1>
          <p className="text-base md:text-2xl text-fdvp-text-light/80 font-light max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200">
            {t.home.heroSubtitle}
          </p>
        </div>

        {/* ACTION BUTTONS - Friendly Pills */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-5 w-full sm:w-auto animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300 px-4 sm:px-0">
          <Link href="/find-people" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto group relative px-6 md:px-8 py-3 md:py-4 bg-fdvp-primary/90 text-fdvp-bg text-base md:text-lg font-medium rounded-full overflow-hidden transition-all hover:bg-fdvp-primary hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] hover:-translate-y-1">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.home.heroBtn}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </span>
            </button>
          </Link>
          {user ? (
            <Link href="/map" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-fdvp-text/5 border border-fdvp-text/10 text-fdvp-text-light text-base md:text-lg font-medium rounded-full backdrop-blur-md transition-all hover:bg-fdvp-text/10 hover:border-fdvp-primary/30 hover:-translate-y-1 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>
                Explore Map
              </button>
            </Link>
          ) : (
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-fdvp-text/5 border border-fdvp-text/10 text-fdvp-text-light text-base md:text-lg font-medium rounded-full backdrop-blur-md transition-all hover:bg-fdvp-text/10 hover:border-fdvp-text/20 hover:-translate-y-1">
                {t.navbar.joinNow}
              </button>
            </Link>
          )}
        </div>

        {/* GLOBAL VISITOR COUNT */}
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-fdvp-text/5 backdrop-blur-sm rounded-full border border-fdvp-text/10 shadow-xl hover:bg-fdvp-text/10 transition-all cursor-default group">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping absolute inset-0 opacity-75"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 relative shadow-lg shadow-green-500/50"></div>
            </div>
            <span className="text-xs font-bold tracking-widest text-fdvp-text-light/50 group-hover:text-fdvp-text-light/80 transition-colors uppercase">
              {visitorCount > 0 ? visitorCount.toLocaleString() : "..."} Web Visitors
            </span>
          </div>
        </div>

      </div>

      {/* SCROLL INDICATOR - Minimalist */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fdvp-text"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
      </div>
    </section>
  );
}