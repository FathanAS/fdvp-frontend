"use client";
import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { Search, Instagram, Loader2, User, Filter, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Import Auth
import ChatWindow from "@/components/ChatWindow"; // Import Chat
import { JOB_CATEGORIES } from "@/data/jobList";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotification } from "@/context/NotificationContext";
import RoleSelector from "@/components/RoleSelector";
import { useLanguage } from "@/context/LanguageContext";

export default function MembersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MembersContent />
        </Suspense>
    );
}

function MembersContent() {
    const { t } = useLanguage();
    const [allMembers, setAllMembers] = useState<any[]>([]); // Store all fetched members
    const [members, setMembers] = useState<any[]>([]); // Displayed/Filtered members
    const [keyword, setKeyword] = useState("");
    const [filterRoles, setFilterRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Default 12 member per halaman
    const { user } = useAuth();
    const { notify } = useNotification();
    const searchParams = useSearchParams();

    // STATE CHAT
    const [activeChat, setActiveChat] = useState<{ id: string, name: string, photoURL: string } | null>(null);

    // CHECK URL FOR CHAT REQUEST
    useEffect(() => {
        const chatWithId = searchParams.get("chatWith");
        if (chatWithId) {
            handleOpenChatFromUrl(chatWithId);
        }
    }, [searchParams]);

    const handleOpenChatFromUrl = async (targetId: string) => {
        const existingMember = members.find(m => m.id === targetId);
        if (existingMember) {
            setActiveChat({
                id: existingMember.id,
                name: existingMember.displayName,
                photoURL: existingMember.photoURL
            });
            return;
        }

        try {
            const docRef = doc(db, "users", targetId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setActiveChat({
                    id: docSnap.id,
                    name: userData.displayName || "Unknown User",
                    photoURL: userData.photoURL
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const QUICK_FILTERS = ["Frontend Developer", "Pro Player", "UI/UX Designer", "Data Scientist", "Product Manager"];

    // FETCH ALL USERS ONCE FROM FIRESTORE
    const fetchAllMembers = async () => {
        setLoading(true);
        setLoadingProgress(0);

        // Simulate progress animation
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90; // Cap at 90% until data arrives
                }
                return prev + Math.random() * 15; // Random increments
            });
        }, 200);

        try {
            // Fetch all users sorted by creation time
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const fetchedData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAllMembers(fetchedData);
            setMembers(fetchedData); // Initialize display with all data
            setLoadingProgress(100); // Complete!
        } catch (error) {
            console.error("Gagal cari member (Firestore):", error);
            notify("Error", "Failed to fetch users data.", "error");
            setMembers([]);
        } finally {
            clearInterval(progressInterval);
            // Short delay to show 100% before hiding
            setTimeout(() => {
                setLoading(false);
            }, 300);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchAllMembers();
    }, []);

    // Client-side Filtering Logic
    useEffect(() => {
        let filtered = allMembers;

        // 1. Filter by Keyword (Name, Job, Email)
        if (keyword.trim()) {
            const lowerKey = keyword.toLowerCase();
            filtered = filtered.filter(m =>
                (m.displayName || "").toLowerCase().includes(lowerKey) ||
                (m.job || "").toLowerCase().includes(lowerKey) ||
                (m.email || "").toLowerCase().includes(lowerKey)
            );
        }

        // 2. Filter by Roles
        if (filterRoles.length > 0) {
            // Assuming filterRoles refers to 'job' or actual 'role'? 
            // The UI says "RoleSelector" but passing into "quick filters" which are Jobs.
            // RoleSelector usually selects 'admin', 'staff'. 
            // But QUICK_FILTERS are "Frontend Developer". 
            // Current backend logic was `role=${rolesQuery}`. 
            // Let's assume the user intends to filter by Job Title OR Role.
            // Since `RoleSelector` might return roles like 'admin', we check both.
            filtered = filtered.filter(m =>
                filterRoles.some(r =>
                    (m.role || "").toLowerCase() === r.toLowerCase() ||
                    (m.job || "").toLowerCase().includes(r.toLowerCase())
                )
            );
        }

        setMembers(filtered);
    }, [keyword, filterRoles, allMembers]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const toggleFilterRole = (role: string) => {
        if (role === "All") {
            setFilterRoles([]);
            // fetchMembers(keyword, []); // Removed, handled by useEffect
            return;
        }

        let newRoles = [...filterRoles];
        if (newRoles.includes(role)) {
            newRoles = newRoles.filter(r => r !== role);
        } else {
            if (newRoles.length >= 3) {
                notify("Limit Reached", "Max 3 filter roles allowd.", "error");
                return;
            }
            newRoles.push(role);
        }
        setFilterRoles(newRoles);
        // fetchMembers(keyword, newRoles); // Removed, handled by useEffect
    };

    // Reset page on search/filter
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, filterRoles]);

    // Helper warna avatar
    const getRandomColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
        return colors[name.length % colors.length];
    };

    const filteredMembers = members.filter(member => {
        const role = (member.role || "").toLowerCase();
        // Log roles for debugging (temporary)
        // console.log(`User: ${member.displayName}, Role: ${role}`); 

        return (
            user?.uid !== member.id &&
            !['owner', 'administrator', 'superadmin'].includes(role)
        );
    });

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">

                {/* HEADER & CONTROLS */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-fdvp-text-light">
                        {t.members.title} <span className="text-fdvp-accent">{t.members.titleHighlight}</span>
                    </h1>
                    <p className="text-fdvp-text mb-8">
                        {t.members.subtitle.replace('{count}', (filteredMembers.length > 0 ? filteredMembers.length : 0).toString())}
                    </p>

                    {/* SEARCH BAR & FILTER CONTAINER */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">

                        {/* SEARCH INPUT */}
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                            <input
                                type="text"
                                placeholder={t.members.searchPlaceholder}
                                className="w-full bg-fdvp-card border border-fdvp-text/20 rounded-xl py-4 pl-12 pr-4 text-fdvp-text-light focus:border-fdvp-accent focus:outline-none transition-all"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <Search className="absolute left-4 top-4 text-fdvp-text" size={20} />
                        </form>

                        {/* ROLE SELECTOR FILTER */}
                        <div className="min-w-[300px] w-full md:w-auto z-50">
                            <RoleSelector
                                selectedRoles={filterRoles}
                                onChange={(roles) => {
                                    setFilterRoles(roles);
                                    // Filtering is now handled reactively via useEffect
                                }}
                                placeholder={t.members.filterRole}
                                maxSelection={3}
                            />
                        </div>

                    </div>

                    {/* QUICK FILTER PILLS (Opsional - Biar lebih User Friendly) */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        <button
                            onClick={() => toggleFilterRole("All")}
                            className={`px-4 py-1 rounded-full text-xs font-bold border transition-all ${filterRoles.length === 0
                                ? "bg-fdvp-accent text-fdvp-bg border-fdvp-accent"
                                : "bg-transparent text-fdvp-text border-fdvp-text/20 hover:border-fdvp-text/50"
                                }`}
                        >
                            {t.members.quickFilter}
                        </button>
                        {QUICK_FILTERS.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => toggleFilterRole(opt)}
                                className={`px-4 py-1 rounded-full text-xs font-bold border transition-all ${filterRoles.includes(opt)
                                    ? "bg-fdvp-accent text-fdvp-bg border-fdvp-accent"
                                    : "bg-transparent text-fdvp-text border-fdvp-text/20 hover:border-fdvp-text/50"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RESULTS GRID */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <Loader2 className="animate-spin text-fdvp-accent" size={48} />

                        {/* Progress Bar */}
                        <div className="w-64 md:w-80">
                            <div className="h-2 bg-fdvp-text/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-fdvp-primary to-fdvp-accent rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                                />
                            </div>
                            <p className="text-center text-fdvp-text/60 text-sm mt-3 font-mono">
                                {Math.round(Math.min(loadingProgress, 100))}%
                            </p>
                        </div>

                        <p className="text-fdvp-text/40 text-xs uppercase tracking-widest">Loading Members...</p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-fdvp-text/20 rounded-xl bg-fdvp-card/30">
                        <p className="text-fdvp-text text-lg">{t.members.emptyState}</p>
                        <button onClick={() => { setKeyword(""); toggleFilterRole("All"); }} className="text-fdvp-accent underline mt-2">
                            {t.members.resetSearch}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {paginatedMembers.map((member) => (
                            <div key={member.id} className="bg-fdvp-card p-4 md:p-6 rounded-2xl border border-fdvp-text/10 hover:border-fdvp-accent hover:-translate-y-1 transition-all group flex flex-col items-center text-center shadow-lg hover:shadow-fdvp-accent/10">

                                {/* AVATAR & INFO */}
                                <div className="flex flex-col items-center w-full mb-3">
                                    <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3 md:mb-4 group/avatar">
                                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-fdvp-bg group-hover:border-fdvp-accent transition-all shadow-md bg-fdvp-bg relative z-10">
                                            {member.photoURL ? (
                                                <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${getRandomColor(member.displayName)}`}>
                                                    {member.displayName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-sm md:text-xl text-fdvp-text-light mb-1 group-hover:text-fdvp-accent transition-colors truncate w-full px-1">
                                        {member.displayName}
                                    </h3>
                                    <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-fdvp-bg text-[10px] md:text-xs font-mono text-fdvp-text uppercase tracking-wider mb-3 border border-fdvp-text/10 line-clamp-1 max-w-full">
                                        {(member.job && member.job.toLowerCase() !== 'member') ? member.job : "Member"}
                                    </span>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex items-center justify-center gap-2 w-full mt-auto">
                                    {/* Chat Button */}
                                    {user && user.uid !== member.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveChat({
                                                    id: member.id,
                                                    name: member.displayName,
                                                    photoURL: member.photoURL
                                                });
                                            }}
                                            className="flex-1 py-2 px-3 bg-fdvp-text/5 hover:bg-fdvp-primary text-fdvp-text hover:text-white rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-fdvp-text/5 hover:border-transparent"
                                        >
                                            <MessageCircle size={14} />
                                            <span>{t.members.chat}</span>
                                        </button>
                                    )}

                                    {/* Profile Button (Icon only on mobile, text on desktop if space) */}
                                    <a href={`/profile?id=${member.id}`} className="py-2 px-3 bg-fdvp-text/5 hover:bg-fdvp-text/10 text-fdvp-text hover:text-fdvp-text-light rounded-xl transition-all text-xs font-bold border border-fdvp-text/5 flex items-center justify-center">
                                        <User size={14} />
                                    </a>

                                    {/* Instagram Button */}
                                    {member.instagram && (
                                        <a href={`https://instagram.com/${member.instagram}`} target="_blank" className="py-2 px-3 bg-fdvp-text/5 hover:bg-pink-500 text-fdvp-text hover:text-white rounded-xl transition-all text-xs font-bold border border-fdvp-text/5 flex items-center justify-center">
                                            <Instagram size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PAGINATION CONTROLS */}
                {/* PAGINATION CONTROLS */}
                {filteredMembers.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 pb-20 pt-8 border-t border-fdvp-text/5">

                        {/* ITEMS PER PAGE SELECTOR */}
                        <div className="flex items-center gap-3 text-sm text-fdvp-text">
                            <span>Show:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-fdvp-card border border-fdvp-text/20 rounded-lg px-2 py-1 focus:outline-none focus:border-fdvp-accent"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                                <option value={100}>100</option>
                            </select>
                            <span>of {filteredMembers.length} members</span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 rounded-lg bg-fdvp-card border border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                                        .map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-sm ${currentPage === page
                                                    ? 'bg-fdvp-accent text-fdvp-bg font-bold shadow-lg shadow-fdvp-accent/20'
                                                    : 'bg-transparent text-fdvp-text hover:bg-fdvp-text/10'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 rounded-lg bg-fdvp-card border border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* RENDER CHAT WINDOW JIKA ADA ACTIVE CHAT */}
            {
                activeChat && user && (
                    <ChatWindow
                        myId={user.uid}
                        myName={user.displayName || user.email || "Me"}
                        myPhoto={user.photoURL}
                        otherUser={activeChat}
                        onClose={() => setActiveChat(null)}
                    />
                )
            }
        </main >
    );
}