"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Calendar, MapPin, Loader2, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotification } from "@/context/NotificationContext";
import ShareModal from "@/components/ShareModal"; // Import Modal

// Definisi Tipe Data Event
interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageHeader: string;
  status: string;
}

export default function EventPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  // Share Modal State
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    url: "",
    title: ""
  });

  // FETCH EVENTS FROM FIRESTORE
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedEvents: EventData[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EventData));

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Gagal mengambil event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleShare = async (e: React.MouseEvent, eventId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/event/${eventId}`;
    setShareModal({
      isOpen: true,
      url: url,
      title: title
    });
  };

  return (
    <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light selection:bg-fdvp-primary/30 overflow-hidden">
      <Navbar />

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ ...shareModal, isOpen: false })}
        url={shareModal.url}
        title={shareModal.title}
      />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-fdvp-primary/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-fdvp-accent/5 rounded-full blur-[128px]"></div>
      </div>

      {/* HEADER SECTION */}
      <div className="relative z-10 pt-40 pb-16 text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
          Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-primary to-fdvp-accent">Events</span>
        </h1>
        <p className="text-fdvp-text max-w-2xl mx-auto text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Don't miss out on FDVP community activities. From technical workshops to casual hangouts, find your next connection here.
        </p>
      </div>

      {/* EVENT GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32">

        {loading ? (
          // LOADING STATE (SKELETON)
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-fdvp-primary" size={48} />
          </div>
        ) : events.length === 0 ? (
          // EMPTY STATE
          <div className="text-center py-20 bg-fdvp-card/50 rounded-3xl border border-dashed border-fdvp-text/10 backdrop-blur-md">
            <Calendar className="mx-auto mb-4 text-fdvp-text/20" size={48} />
            <p className="text-xl text-fdvp-text/50 font-light">No upcoming events found.</p>
          </div>
        ) : (
          // DATA LIST
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {events.map((event, idx) => (
              <div
                key={event.id}
                className="group relative bg-fdvp-card rounded-3xl overflow-hidden border border-fdvp-text/10 hover:border-fdvp-accent hover:-translate-y-2 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8 shadow-sm hover:shadow-xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* IMAGE HEADER */}
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src={event.imageHeader}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                  />

                  {/* Share Button (Top Left) */}
                  <button
                    onClick={(e) => handleShare(e, event.id, event.title)}
                    className="absolute top-4 left-4 z-30 p-2.5 bg-black/40 hover:bg-fdvp-primary backdrop-blur-md border border-white/10 rounded-xl text-white transition-all transform hover:scale-110 active:scale-95"
                    title="Share Event"
                  >
                    <Share2 size={18} />
                  </button>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                      {event.status}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-8 flex-1 flex flex-col items-start">
                  {/* Date Badge */}
                  <div className="flex items-center gap-2 mb-4 text-fdvp-primary text-xs font-bold uppercase tracking-widest">
                    <Calendar size={14} />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 line-clamp-2 text-fdvp-text-light group-hover:text-fdvp-primary transition-colors duration-300">
                    {event.title}
                  </h3>


                  <div className="flex items-start gap-2 text-fdvp-text text-sm mb-6">
                    <MapPin size={16} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{event.location}</span>
                  </div>

                  <p className="text-sm text-fdvp-text line-clamp-3 mb-8 flex-1 leading-relaxed">
                    {event.description}
                  </p>

                  <Link href={`/event/${event.id}`} className="w-full mt-auto">
                    <button className="group/btn w-full py-4 rounded-xl bg-fdvp-bg border border-fdvp-text/10 text-fdvp-text-light font-medium hover:bg-fdvp-primary hover:text-white hover:border-fdvp-primary transition-all flex items-center justify-center gap-2">
                      View Details
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main >
  );
}