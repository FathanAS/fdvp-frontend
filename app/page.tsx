"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CommunitySections from "@/components/CommunitySections";
import GallerySection from "@/components/GallerySections";
import ContactCTA from "@/components/ContactCTA";
import { useLanguage } from "@/context/LanguageContext";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light overflow-hidden selection:bg-fdvp-primary/30">
      <Navbar />
      <Hero />

      {/* Content for Logged In Users ONLY */}
      {user && (
        <>
          {/* Community Section with subtle separator */}
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-fdvp-bg to-transparent z-10 pointer-events-none"></div>
            <CommunitySections />
          </div>

          <GallerySection />
          <ContactCTA />
        </>
      )}

      {/* Minimalist Footer */}
      <footer className="relative py-12 border-t border-fdvp-text/5 bg-fdvp-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Logo & Copyright */}
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-fdvp-text-light tracking-tight mb-1">FDVP<span className="text-fdvp-primary">.</span></h2>
            <p className="text-xs text-fdvp-text/50">{t.home.footerCopyright}</p>
          </div>

          {/* Social Links */}
          <div className="flex gap-6">
            {['youtube', 'instagram', 'linkedin', 'twitter'].map((socialKey) => (
              <a key={socialKey} href="#" className="text-sm font-medium text-fdvp-text/60 hover:text-fdvp-primary transition-colors">
                {t.home.socialLinks[socialKey as keyof typeof t.home.socialLinks]}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}