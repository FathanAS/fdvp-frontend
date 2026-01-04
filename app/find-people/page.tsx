"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { MapPin, Instagram, Loader2, Navigation, User, MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function FindPeoplePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myLoc, setMyLoc] = useState<{ lat: number, long: number } | null>(null);

  // 1. Ambil Lokasi Saat Halaman Dibuka
  // 1. Ambil Lokasi Saat Halaman Dibuka & UPDATE Profile Otomatis
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            long: position.coords.longitude
          };
          setMyLoc(loc);

          // Update Profile Location Automatically if User is Logged In
          if (user?.uid) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/${user.uid}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude: loc.lat,
                longitude: loc.long
              })
            }).then(() => console.log("Location auto-updated"))
              .catch(err => console.error("Auto-update loc failed", err));
          }
        },
        (error) => {
          console.error("Error getting location: ", error);
          // Optional: Handle error state here if needed, e.g. show a toast
        }
      );
    }
  }, [user]); // Add user dependency to ensure update runs if user loads late

  // 2. Jika lokasi dapat, cari orang sekitar via Backend
  useEffect(() => {
    if (myLoc) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...myLoc, userId: user?.uid })
      })
        .then(res => res.json())
        .then(data => setPeople(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [myLoc]);

  return (
    <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-fdvp-text-light">
            {t.findPeople.title} <span className="text-fdvp-accent">{t.findPeople.titleHighlight}</span>
          </h1>
          <p className="text-fdvp-text max-w-2xl mx-auto flex items-center justify-center gap-2">
            <Navigation size={16} className="text-fdvp-primary" />
            {myLoc ? t.findPeople.scanning : t.findPeople.allowLoc}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center h-40"><Loader2 className="animate-spin text-fdvp-accent" size={40} /></div>
        ) : people.length === 0 && myLoc ? (
          <div className="text-center py-20 bg-fdvp-card/50 rounded-xl border border-dashed border-fdvp-text/20">
            <p className="text-xl text-fdvp-text">{t.findPeople.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {people.map((person) => (
              <div key={person.id} className="bg-fdvp-card p-4 md:p-6 rounded-2xl border border-fdvp-text/10 hover:border-fdvp-accent hover:-translate-y-1 transition-all group flex flex-col items-center text-center shadow-lg hover:shadow-fdvp-accent/10">

                {/* AVATAR & INFO */}
                <div className="flex flex-col items-center w-full mb-3">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3 md:mb-4 group/avatar">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-fdvp-bg group-hover:border-fdvp-accent transition-all shadow-md bg-fdvp-bg relative z-10">
                      {person.photoURL ? (
                        <img src={person.photoURL} alt={person.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-fdvp-primary/50">
                          {person.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm md:text-xl text-fdvp-text-light mb-1 group-hover:text-fdvp-accent transition-colors truncate w-full px-1">
                    {person.displayName}
                  </h3>
                  <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-fdvp-bg text-[10px] md:text-xs font-mono text-fdvp-text uppercase tracking-wider mb-2 border border-fdvp-text/10 line-clamp-1 max-w-full">
                    {person.job || "Member"}
                  </span>

                  {/* Distance Badge */}
                  <div className="flex items-center gap-1.5 text-xs text-fdvp-accent bg-fdvp-accent/5 px-3 py-1 rounded-full border border-fdvp-accent/10 mb-2">
                    <MapPin size={12} />
                    <span className="font-bold">{person.distance}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-center gap-2 w-full mt-auto pt-2 border-t border-fdvp-text/5">
                  {/* Chat Button */}
                  {user && user.uid !== person.id && (
                    <button
                      onClick={() => {/* Chat logic needs ChatWindow integration, adding soon */ }}
                      className="flex-1 py-2 px-3 bg-fdvp-text/5 hover:bg-fdvp-primary text-fdvp-text hover:text-white rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-fdvp-text/5 hover:border-transparent opacity-50 cursor-not-allowed"
                      title="Chat available in Member list"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                    </button>
                  )}

                  {/* Profile Button */}
                  <a href={`/profile?id=${person.id}`} className="py-2 px-3 bg-fdvp-text/5 hover:bg-fdvp-text/10 text-fdvp-text hover:text-fdvp-text-light rounded-xl transition-all text-xs font-bold border border-fdvp-text/5 flex items-center justify-center">
                    <User size={14} />
                  </a>

                  {/* Instagram Button */}
                  {person.instagram && (
                    <a href={`https://instagram.com/${person.instagram}`} target="_blank" className="py-2 px-3 bg-fdvp-text/5 hover:bg-pink-500 text-fdvp-text hover:text-white rounded-xl transition-all text-xs font-bold border border-fdvp-text/5 flex items-center justify-center">
                      <Instagram size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}