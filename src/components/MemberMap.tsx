"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, ChevronRight, MapPin } from "lucide-react";

// Dynamic import for MapContainer to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayerWithNoSSR = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);

const MarkerWithNoSSR = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);

const PopupWithNoSSR = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

// Fix Icon Leaflet di Next.js
const iconMember = typeof window !== 'undefined' ? L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // Icon Avatar User kecil
    iconSize: [30, 30],
    className: "rounded-full border-2 border-white shadow-lg",
}) : null;

import { PROVINCE_COORDS } from "@/data/coordinates";
import { useAuth } from "@/context/AuthContext";

interface Member {
    id: string;
    displayName: string;
    job: string;
    lat: number;
    lng: number;
    photoURL?: string;
    province?: string;
    role?: string;
}

const ClusterPopupContent = ({ members }: { members: Member[] }) => {
    const [search, setSearch] = useState("");
    const filtered = members.filter(m =>
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.job.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col max-h-[350px] w-full bg-[#14141e] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/10 bg-[#14141e] sticky top-0 z-10">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Find member..."
                        className="w-full bg-[#0b141a] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-200 focus:outline-none focus:border-fdvp-accent transition-all placeholder:text-gray-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar min-h-[100px]">
                {filtered.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">No members found</div>
                ) : (
                    filtered.map(member => (
                        <a
                            key={member.id}
                            href={`/profile?id=${member.id}`}
                            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group border border-transparent hover:border-white/5"
                        >
                            <div className="w-8 h-8 min-w-[32px] rounded-full overflow-hidden border border-white/10 group-hover:border-fdvp-accent/50">
                                <img src={member.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-full h-full object-cover" alt={member.displayName} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-fdvp-accent transition-colors">{member.displayName}</h4>
                                <p className="text-[10px] text-gray-500 truncate">{member.job}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-700 group-hover:text-fdvp-accent transition-colors" />
                        </a>
                    ))
                )}
            </div>
            <div className="p-2 border-t border-white/10 bg-[#0b141a]/50 text-center">
                <span className="text-[10px] text-gray-500 font-medium">
                    {filtered.length} members at this location
                </span>
            </div>
        </div>
    )
}

export default function MemberMap() {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // FETCH DATA MEMBER YANG PUNYA LOKASI
    useEffect(() => {
        if (!isMounted) return;
        const fetchMembers = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/public/list?limit=500`);
                const data = await res.json();

                // Leadership roles to exclude (Security Filter)
                const leadershipRoles = ['owner', 'administrator', 'superadmin', 'admin', 'staff', 'manager', 'founder', 'co-founder', 'executive'];

                const mappedMembers = data
                    .filter((u: any) => {
                        const role = (u.role || 'user').toLowerCase();
                        // Filter: No Leadership AND Not current user
                        return !leadershipRoles.includes(role) && u.id !== user?.uid;
                    }) // STRICT FILTER: No Leadership & No Self
                    .map((u: any) => {
                        // Priority 1: Exact coordinates
                        if (u.latitude && u.longitude) {
                            return {
                                id: u.id,
                                displayName: u.displayName,
                                job: u.job || "Member",
                                lat: u.latitude,
                                lng: u.longitude,
                                photoURL: u.photoURL,
                                province: u.province,
                                role: u.role
                            };
                        }

                        // Priority 2: Province fallback (case-insensitive & robust matching)
                        if (u.province) {
                            const normalizedProvince = u.province.toLowerCase();
                            const matchedKey = Object.keys(PROVINCE_COORDS).find(
                                key => key.toLowerCase() === normalizedProvince ||
                                    normalizedProvince.includes(key.toLowerCase()) ||
                                    key.toLowerCase().includes(normalizedProvince)
                            );

                            if (matchedKey) {
                                const [pLat, pLng] = PROVINCE_COORDS[matchedKey];
                                return {
                                    id: u.id,
                                    displayName: u.displayName,
                                    job: u.job || "Member",
                                    lat: pLat, // Exact province center (NO JITTER)
                                    lng: pLng, // Exact province center (NO JITTER)
                                    photoURL: u.photoURL,
                                    province: u.province,
                                    role: u.role
                                };
                            }
                        }

                        return null;
                    })
                    .filter((m: any) => m !== null);

                setMembers(mappedMembers);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMembers();
    }, [isMounted]);

    // Grouping Members by Coordinates
    const groupedClusters = useMemo(() => {
        const groups: Record<string, Member[]> = {};
        members.forEach(m => {
            const key = `${m.lat}-${m.lng}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return Object.values(groups);
    }, [members]);

    if (!isMounted) return <div className="h-[500px] w-full bg-fdvp-card animate-pulse rounded-2xl" />;

    return (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-fdvp-text/20 z-0 relative shadow-2xl ring-1 ring-white/10">
            {/* Custom Styles for Leaflet Popup Glassmorphism */}
            <style jsx global>{`
                .leaflet-popup-content-wrapper {
                    background: rgba(20, 20, 30, 0.95) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    border-radius: 16px !important;
                    color: white !important;
                    padding: 0 !important;
                    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.6) !important;
                    overflow: hidden !important;
                }
                .leaflet-popup-tip {
                    background: rgba(20, 20, 30, 0.95) !important;
                    border-top: 1px solid rgba(255, 255, 255, 0.15);
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    width: 280px !important;
                }
                .leaflet-container a.leaflet-popup-close-button {
                    color: #fff !important;
                    top: 10px !important;
                    right: 10px !important;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                }
            `}</style>

            <MapWithNoSSR
                center={[-2.5489, 118.0149] as any} // Tengah-tengah Indonesia
                zoom={5}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", background: "#0b141a" }}
            >
                {/* Peta Gelap (Dark Mode) agar estetik */}
                <TileLayerWithNoSSR
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {groupedClusters.map((cluster, idx) => {
                    const firstMember = cluster[0];
                    const isCluster = cluster.length > 1;

                    return (
                        <MarkerWithNoSSR
                            key={`cluster-${idx}`}
                            position={[firstMember.lat, firstMember.lng]}
                            icon={typeof window !== 'undefined' ? L.divIcon({
                                className: "bg-transparent border-none",
                                html: `
                                    <div class="w-10 h-10 relative group cursor-pointer">
                                        <div class="w-full h-full rounded-full border-2 ${isCluster ? 'border-fdvp-accent' : 'border-fdvp-accent/50'} overflow-hidden shadow-glow transition-transform duration-300 transform group-hover:scale-110 bg-[#0b141a]">
                                            <img src="${firstMember.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" class="w-full h-full object-cover" alt="${firstMember.displayName}" />
                                        </div>
                                        ${isCluster ? `
                                            <div class="absolute -top-1 -right-1 bg-fdvp-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0b141a] shadow-lg animate-bounce">
                                                ${cluster.length}
                                            </div>
                                        ` : ''}
                                    </div>
                                `,
                                iconSize: [40, 40],
                                iconAnchor: [20, 20],
                                popupAnchor: [0, -24]
                            }) : (iconMember as any)}
                        >
                            <PopupWithNoSSR>
                                {isCluster ? (
                                    <ClusterPopupContent members={cluster} />
                                ) : (
                                    <div className="flex flex-col bg-[#14141e] rounded-xl overflow-hidden">
                                        {/* Single Member Popup (Legacy Style) */}
                                        <div className="h-16 bg-gradient-to-r from-fdvp-primary/20 to-fdvp-accent/20 flex items-center justify-center relative">
                                            <div className="absolute -bottom-6 w-full flex justify-center">
                                                <div className="w-14 h-14 rounded-full p-1 bg-[#14141e] shadow-xl">
                                                    <img
                                                        src={firstMember.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt={firstMember.displayName}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 pb-4 px-4 text-center">
                                            <h3 className="text-lg font-bold text-white truncate leading-tight mb-1">
                                                {firstMember.displayName}
                                            </h3>
                                            <span className="inline-block px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-fdvp-accent font-mono uppercase tracking-wider mb-3">
                                                {firstMember.job}
                                            </span>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4 border-t border-white/5 pt-3">
                                                <div>
                                                    <span className="block text-[9px] uppercase tracking-widest opacity-50">Location</span>
                                                    {firstMember.province || "Unknown"}
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] uppercase tracking-widest opacity-50">Status</span>
                                                    Active
                                                </div>
                                            </div>

                                            <a
                                                href={`/profile?id=${firstMember.id}`}
                                                className="block w-full py-2 bg-fdvp-primary hover:bg-fdvp-accent text-white rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-fdvp-primary/30"
                                            >
                                                View Full Profile
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </PopupWithNoSSR>
                        </MarkerWithNoSSR>
                    );
                })}
            </MapWithNoSSR>

            {/* Overlay Statistik */}
            <div className="absolute top-4 right-4 z-[400] bg-black/40 backdrop-blur-xl text-white p-5 rounded-2xl border border-white/10 shadow-2xl max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Live Activity</p>
                </div>
                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {members.length}
                </h3>
                <p className="text-xs text-fdvp-accent opacity-80 mt-1">Citizens Online</p>
            </div>
        </div>
    );
}