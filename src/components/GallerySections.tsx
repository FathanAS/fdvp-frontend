"use client";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function GallerySection() {
  return (
    <section className="bg-fdvp-bg py-32 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-1/2 right-[-10%] w-[500px] h-[500px] bg-fdvp-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">

        {/* LEFT: COMPOSITION */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                name: "Bekasi",
                image: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&q=80"
              },
              {
                name: "Surabaya",
                image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&q=80"
              },
              {
                name: "Palembang",
                image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80"
              },
              {
                name: "Semarang",
                image: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&q=80"
              },
            ].map((city, i) => (
              <div key={city.name} className={`relative rounded-3xl overflow-hidden h-40 md:h-52 bg-fdvp-text/5 border border-fdvp-text/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:border-fdvp-primary/30 ${i % 2 === 0 ? 'translate-y-8' : ''}`}>
                <div className="absolute inset-0 bg-cover bg-center brightness-75 hover:brightness-100 transition-all duration-700" style={{ backgroundImage: `url('${city.image}')` }}></div>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {/* City Name Label */}
                <div className="absolute bottom-4 left-4 z-10">
                  <p className="text-white font-bold text-sm drop-shadow-lg">{city.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fdvp-card/80 backdrop-blur-xl border border-fdvp-text/10 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
            <div className="p-2 bg-fdvp-primary rounded-full text-fdvp-bg">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-fdvp-text-light font-bold text-sm">Indonesian Network</p>
              <p className="text-xs text-fdvp-text">Connect locally</p>
            </div>
          </div>
        </div>

        {/* RIGHT: CONTENT */}
        <div className="text-left">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-fdvp-text-light leading-tight">
            Connect <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-primary to-fdvp-accent">Locally.</span>
          </h2>
          <p className="text-fdvp-text/70 mb-10 text-lg leading-relaxed font-light">
            Discover FDVP members in your city. Host meetups, share knowledge, or simply grab a coffee with like-minded visionaries.
          </p>
          <Link href="/find-people">
            <button className="px-8 py-4 bg-fdvp-text/5 text-fdvp-text-light font-medium rounded-full border border-fdvp-text/10 hover:bg-fdvp-text/10 hover:border-fdvp-primary/50 hover:text-fdvp-primary transition-all flex items-center gap-2 group">
              Find People Nearby
              <MapPin size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}