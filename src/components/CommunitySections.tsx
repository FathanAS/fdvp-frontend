"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, MessageCircle, Instagram, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/context/AuthContext";
import ChatWindow from "@/components/ChatWindow";

export default function CommunitySections() {
  const [staff, setStaff] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Chat State
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, photoURL: string } | null>(null);

  useEffect(() => {
    setLoading(true);

    // 1. REALTIME LEADERSHIP (Staff Roles)
    // Query specifically for roles to ensure old accounts (owners) are included
    const staffRoles = ['owner', 'administrator', 'superadmin', 'admin', 'staff', 'manager'];
    const qStaff = query(
      collection(db, "users"),
      where('role', 'in', staffRoles)
    );

    const unsubStaff = onSnapshot(qStaff, (snapshot: any) => {
      const fetchedStaff = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Sort manually (Owner first, then specific hierarchy if needed)
      // Custom sort: Owner -> SuperAdmin -> Admin -> Manager -> Staff
      const roleOrder: Record<string, number> = {
        'owner': 0, 'administrator': 1, 'superadmin': 1, 'admin': 2, 'manager': 3, 'staff': 4
      };

      fetchedStaff.sort((a: any, b: any) => {
        const orderA = roleOrder[a.role] ?? 99;
        const orderB = roleOrder[b.role] ?? 99;
        return orderA - orderB;
      });

      setStaff(fetchedStaff);
      setLoading(false);
    }, (error: any) => {
      console.error("Error listening to staff:", error);
      setLoading(false);
    });

    // 2. REALTIME NEW MEMBERS
    // Fetch recent 50 users for the member list
    const qMembers = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(20) // Limit to 20 for cleaner UI
    );

    const unsubMembers = onSnapshot(qMembers, (snapshot: any) => {
      const allRecent = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Filter out high-level roles from the "Member" list if desired, 
      // or just show everyone. Let's filter out core leadership from "New Members" 
      // to avoid duplication if preferred, but usually "New Members" can include everyone.
      // Current implementation in code tried to separate them. Let's strict filter.
      const highLevelRoles = ['owner', 'administrator', 'superadmin'];
      const filteredMembers = allRecent.filter((u: any) => !highLevelRoles.includes(u.role));

      setMembers(filteredMembers);

      // Update Total Count (Optimistic or separate fetch)
      // Since we only fetch 20, we can't know total from this snapshot.
      // We'll keep the separate fetch for count logic below or just use this list length.
    });

    // 3. FETCH TOTAL COUNT (Once)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/public/count`)
      .then(res => res.json())
      .then(data => setTotalMembers(data.total || 0))
      .catch(() => console.log("Count fetch failed"));

    return () => {
      unsubStaff();
      unsubMembers();
    };
  }, []);

  const getRandomColor = (name: string) => {
    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-violet-500', 'bg-fuchsia-500'];
    const index = (name || "U").length % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-fdvp-bg text-fdvp-text-light py-24 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-fdvp-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fdvp-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* SECTION: LEADERSHIP TEAM */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-primary to-fdvp-accent">Leaders</span>
            </h2>
            <p className="text-fdvp-text/60 text-lg max-w-2xl mx-auto">
              The dedicated team behind the vision, guiding our community forward.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-fdvp-primary" size={32} />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center p-8 bg-fdvp-text/5 rounded-3xl border border-fdvp-text/5 mx-auto max-w-md">
              <p className="text-fdvp-text opacity-50">Leadership team is assembling...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {staff.slice(0, 4).map((person) => (
                  <div key={person.id} className="group relative bg-fdvp-text/5 hover:bg-fdvp-text/10 border border-fdvp-text/5 hover:border-fdvp-text/20 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1">

                    {/* Badge */}
                    <div className="absolute top-2 right-2 z-20 max-w-[60%] flex justify-end">
                      <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider truncate border ${person.role === 'owner' ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                        person.role === 'administrator' || person.role === 'superadmin' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                          "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}>
                        {person.role}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-4 rounded-full p-1 group-hover:scale-105 transition-transform">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-fdvp-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative w-full h-full rounded-full overflow-hidden bg-fdvp-card">
                          {person.photoURL ? (
                            <img src={person.photoURL} alt={person.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-2xl font-bold text-fdvp-text-light ${getRandomColor(person.displayName)}`}>
                              {(person.displayName || "S").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-fdvp-text-light mb-1 group-hover:text-fdvp-primary transition-colors text-center">
                        {person.displayName || "Unknown"}
                      </h3>
                      <p className="text-sm text-fdvp-text/60 text-center mb-4 min-h-[20px]">
                        {person.job || "Core Team"}
                      </p>

                      {/* CTA Removed for Landing Page */}
                    </div>
                  </div>
                ))}
              </div>

              {/* VIEW ALL BUTTON */}
              {staff.length > 4 && (
                <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <Link href="/leaders" className="group flex items-center gap-3 px-8 py-3 rounded-full bg-fdvp-text/5 hover:bg-fdvp-primary hover:text-white border border-fdvp-text/10 text-fdvp-text font-bold transition-all shadow-sm hover:shadow-lg hover:shadow-fdvp-primary/20">
                    <span>View Full Team</span>
                    <Users size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* SECTION: ACTIVE MEMBERS */}
        <section>
          <div className="text-center mb-12 flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-primary to-fdvp-accent">Members</span>
            </h2>

            {/* Counter Pill */}
            <div className="inline-flex items-center gap-2 bg-fdvp-text/5 border border-fdvp-text/10 px-5 py-2 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-fdvp-text/80 text-sm">Active Members:</span>
              <span className="font-bold text-fdvp-text-light">{totalMembers}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-fdvp-primary/50" size={32} />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-fdvp-text/50">Be the first to join!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {members.slice(0, 10).map((member) => (
                <div key={member.id} className="group relative bg-fdvp-text/5 border border-fdvp-text/5 hover:border-fdvp-primary/30 rounded-2xl p-4 transition-all hover:bg-fdvp-text/10 hover:-translate-y-1 overflow-hidden">

                  {/* Avatar - Non-Clickable */}
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-fdvp-text/5 relative group-hover:scale-105 transition-transform duration-300 border-2 border-transparent group-hover:border-fdvp-primary/30">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-xl font-bold text-fdvp-text-light ${getRandomColor(member.displayName)}`}>
                          {(member.displayName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center mb-4">
                    <p className="font-medium text-fdvp-text-light text-sm truncate px-1 block">
                      {member.id === user?.uid ? "Me" : (member.displayName || "Member")}
                    </p>
                    <p className="text-[10px] text-fdvp-text/50 uppercase tracking-widest mt-1 truncate">
                      {member.job || "Member"}
                    </p>
                  </div>




                </div>
              ))}

              {/* See All Card */}
              <Link href="/members" className="flex flex-col items-center justify-center bg-transparent border border-dashed border-fdvp-text/10 rounded-2xl p-4 hover:border-fdvp-primary/50 hover:bg-fdvp-primary/5 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-fdvp-text/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-fdvp-primary">
                  <Users size={20} />
                </div>
                <span className="text-sm font-medium text-fdvp-primary">View All</span>
              </Link>
            </div>
          )}
        </section>

        {/* RENDER CHAT WINDOW */}
        {activeChat && user && (
          <ChatWindow
            myId={user.uid}
            myName={user.displayName || user.email || "Me"}
            myPhoto={user.photoURL}
            otherUser={activeChat}
            onClose={() => setActiveChat(null)}
          />
        )}
      </div>
    </div>
  );
}