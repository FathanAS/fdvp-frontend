"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { LogOut, User, Ticket, MapPin, Calendar, Loader2, Edit, Save, Instagram, Camera, Linkedin, Twitter, Github, Globe, Eye, Facebook, Youtube, Gamepad2, Music2, Plus, X, Trash2, Lock } from "lucide-react";



import { useNotification } from "@/context/NotificationContext";
import { doc, updateDoc } from "firebase/firestore";
import TicketModal from "@/components/TicketModal";
import RoleSelector from "@/components/RoleSelector";
import { JOB_CATEGORIES } from "@/data/jobList";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

interface MyTicket {
    registrationId: string;
    eventTitle: string;
    eventImage: string;
    eventDate: string;
    eventLocation: string;
    status: string;
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-fdvp-bg flex items-center justify-center"><Loader2 className="animate-spin text-fdvp-primary" /></div>}>
            <ProfileContent />
        </Suspense>
    );
}

function ProfileContent() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { notify } = useNotification();

    // DETERMINE TARGET USER (View Self vs View Other)
    const paramId = searchParams.get('id');
    const isOwnProfile = !paramId || (user && paramId === user.uid);
    const targetUserId = paramId || user?.uid;

    const [tickets, setTickets] = useState<MyTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);


    // Supported Socials Configuration
    const AVAILABLE_SOCIALS = [
        { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', placeholder: 'Username' },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', placeholder: 'Profile URL' },
        { key: 'github', label: 'GitHub', icon: Github, color: 'text-gray-400', placeholder: 'Profile URL' },
        { key: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-400', placeholder: 'Profile URL' },
        { key: 'website', label: 'Website', icon: Globe, color: 'text-green-500', placeholder: 'https://...' },
        { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700', placeholder: 'Profile URL' },
        { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', placeholder: 'Channel URL' },
        { key: 'tiktok', label: 'TikTok', icon: Music2, color: 'text-pink-400', placeholder: 'Profile URL' },
        { key: 'discord', label: 'Discord', icon: Gamepad2, color: 'text-indigo-500', placeholder: 'Username/ID' },
    ];

    // Profile Data State
    const [profile, setProfile] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Ticket Modal State
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    // Social Modal State
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({
        displayName: "",
        job: "",
        bio: "",
        gender: "Prefer not to say",
        dob: "", // Private DOB
        calculatedAge: null, // Temporary store for age
        instagram: "",
        linkedin: "",
        twitter: "",
        github: "",
        website: "",
        facebook: "",
        youtube: "",
        tiktok: "",
        discord: "",
        latitude: 0,
        longitude: 0,
        province: "",
        city: "",
        photoURL: "",
        showAge: true
    });
    const [isUploading, setIsUploading] = useState(false);

    // Crop State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        const fetchTargetProfile = async () => {
            if (!targetUserId) {
                setLoadingData(false);
                return;
            }

            setLoadingData(true);
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";
                const res = await fetch(`${backendUrl}/users/${targetUserId}?viewerId=${user?.uid || ''}`);

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);

                    if (isOwnProfile) {
                        setFormData({
                            displayName: data.displayName || "",

                            job: data.job || "",
                            bio: data.bio || "",
                            gender: data.gender || "Prefer not to say",
                            dob: data.dob || "",
                            instagram: data.instagram || "",
                            linkedin: data.linkedin || "",
                            twitter: data.twitter || "",
                            github: data.github || "",
                            website: data.website || "",
                            facebook: data.facebook || "",
                            youtube: data.youtube || "",
                            tiktok: data.tiktok || "",
                            discord: data.discord || "",
                            latitude: data.latitude || 0,
                            longitude: data.longitude || 0,
                            province: data.province || "",
                            city: data.city || "",
                            photoURL: data.photoURL || "",
                            showAge: data.showAge !== undefined ? data.showAge : true
                        });
                    }
                } else {
                    notify("Error", "User not found", "error");
                }
            } catch (err) {
                console.error(err);
                notify("Error", "Failed to load profile", "error");
            } finally {
                setLoadingData(false);
            }
        };

        fetchTargetProfile();
    }, [targetUserId, isOwnProfile, user]);

    // Handle Photo Select (Only for Own Profile)
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOwnProfile) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            notify("Upload Failed", "File size too large! Max 5MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImageSrc(reader.result?.toString() || "");
            setShowCropper(true);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const performCropAndUpload = async () => {
        if (!imageSrc || !croppedAreaPixels || !user?.uid) return;

        setIsUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Cropping failed");

            const imageFormData = new FormData();
            imageFormData.append("file", croppedBlob);
            imageFormData.append("upload_preset", "fdvp_events");
            const cloudName = "difdnmf2b";

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: imageFormData
            });

            const uploadData = await uploadRes.json();
            if (!uploadData.secure_url) throw new Error("Cloudinary Error");

            const downloadURL = uploadData.secure_url;
            setFormData((prev: any) => ({ ...prev, photoURL: downloadURL }));

            // Update Backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";
            await fetch(`${backendUrl}/users/${user.uid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoURL: downloadURL }),
            });

            // Update Auth
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: downloadURL });
            }

            notify("Success", "Photo updated permanently!", "success");
            setShowCropper(false);
            setImageSrc(null);
            setProfile((prev: any) => ({ ...prev, photoURL: downloadURL }));

        } catch (error: any) {
            console.error("Upload gagal:", error);
            notify("Error", "Failed to upload photo", "error");
        } finally {
            setIsUploading(false);
        }
    };

    // Auto-fetch City/Province when Lat/Long changes
    useEffect(() => {
        const fetchAddress = async () => {
            if (!formData.latitude || !formData.longitude) return;

            // Avoid refetching if city/province is already set and matches current load (simple check)
            // But we want "auto-update" if coords change.
            // Let's rely on Nominatim.

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.latitude}&lon=${formData.longitude}`);
                const data = await res.json();

                if (data && data.address) {
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
                    const province = data.address.state || data.address.region || "";

                    if (city !== formData.city || province !== formData.province) {
                        setFormData((prev: any) => ({
                            ...prev,
                            city: city,
                            province: province
                        }));
                        // Optional: notify("Location Updated", `Moved to: ${city}, ${province}`, "success");
                    }
                }
            } catch (error) {
                console.error("Reverse geocode error:", error);
            }
        };

        // Debounce or just run? For safety with API limits, maybe we only run if it changed significantly?
        // Since user only updates via button, it's fine to run once per button click basically.
        // But initial load also sets it. We should avoid overwriting initial data unless it was empty.

        if (isEditing && formData.latitude !== 0 && formData.longitude !== 0) {
            fetchAddress();
        }

    }, [formData.latitude, formData.longitude, isEditing]);

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            notify("Fetching Location", "Getting coordinates...", "success");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Update Coordinates -> This triggers the useEffect to fetch address
                    setFormData((prev: any) => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                },
                (error) => notify("Location Error", error.message, "error")
            );
        } else {
            notify("Error", "Browser doesn't support GPS.", "error");
        }
    };

    const handleSaveProfile = async () => {
        try {
            if (!user?.uid) return;
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";

            // Prepare Data: If calculatedAge is set (from DOB change), save it as 'age'
            const dataToSave = { ...formData };
            if (formData.calculatedAge !== null && formData.calculatedAge !== undefined) {
                dataToSave.age = formData.calculatedAge;
            }

            // 1. Update Backend (Firestore) - This is the primary source of truth
            const res = await fetch(`${backendUrl}/users/${user.uid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });

            const data = await res.json();
            if (res.ok) {
                // 2. Refresh Local Profile State immediately
                setProfile({ ...profile, ...formData });
                setIsEditing(false);
                notify("Success", "Profile Updated!", "success");

                // 3. Sync with Firebase Auth (Non-blocking)
                if (auth.currentUser) {
                    try {
                        const updateData: { displayName?: string | null; photoURL?: string | null } = {};
                        if (formData.displayName) updateData.displayName = formData.displayName;
                        // Handle photoURL: empty string should be null for Firebase
                        if (formData.photoURL === "") updateData.photoURL = null;
                        else if (formData.photoURL) updateData.photoURL = formData.photoURL;

                        await updateProfile(auth.currentUser, updateData);
                    } catch (firebaseErr: any) {
                        console.warn("Firebase Auth Profile Sync warning:", firebaseErr);
                        // We don't notify user here because backend save succeeded, 
                        // and 'auth/network-request-failed' shouldn't scare the user if data is actually saved.
                    }
                }
            } else {
                notify("Failed", data.message || "Update failed", "error");
            }
        } catch (err) {
            console.error("Profile Save Error:", err);
            notify("Error", "Could not save profile changes", "error");
        }
    };

    // Protection: If viewing self but not logged in, redirect. If viewing other, public access allowed so no redirect needed (unless private mode?)
    useEffect(() => {
        if (!authLoading && !user && isOwnProfile && !loadingData) {
            router.push("/login");
        }
    }, [user, authLoading, router, isOwnProfile, loadingData]);

    // Fetch Tickets (Private Only)
    // Fetch Tickets (Private or Public)
    useEffect(() => {
        if (targetUserId) {
            const fetchTickets = async () => {
                setLoadingTickets(true);
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";
                    const res = await fetch(`${backendUrl}/registrations/user/${targetUserId}`);
                    const data = await res.json();
                    setTickets(data);
                } catch (error) {
                    console.error("Gagal ambil tiket:", error);
                } finally {
                    setLoadingTickets(false);
                }
            };
            fetchTickets();
        }
    }, [targetUserId]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/");
    };

    const handleOpenTicket = (ticket: any) => {
        setSelectedTicket({
            ...ticket,
            displayName: profile?.displayName || user?.email
        });
        setIsTicketOpen(true);
    };

    if (loadingData && (!profile || !isOwnProfile)) {
        return <div className="min-h-screen flex justify-center items-center bg-fdvp-bg"><Loader2 className="animate-spin text-fdvp-primary" /></div>;
    }

    if (!profile && !loadingData) {
        return (
            <div className="min-h-screen bg-fdvp-bg text-fdvp-text-light flex flex-col items-center justify-center">
                <Navbar />
                <p>User not found or deleted.</p>
                <button onClick={() => router.push('/')} className="mt-4 text-fdvp-primary">Go Home</button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light pb-20">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 pt-32 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* LEFT COLUMN: IDENTITY CARD */}
                <div className="md:col-span-1">
                    <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-8 text-center sticky top-24 shadow-lg">

                        {!isEditing ? (
                            <>
                                {/* Avatar */}
                                <div className="w-28 h-28 bg-fdvp-primary/20 rounded-full mx-auto flex items-center justify-center text-fdvp-accent mb-4 border-4 border-fdvp-bg shadow-xl overflow-hidden relative">
                                    {profile?.photoURL ?
                                        <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                                        : <User size={48} />
                                    }
                                </div>

                                <h2 className="text-2xl font-bold mb-1 text-fdvp-text-light">{profile?.displayName || "Member"}</h2>
                                <p className="text-fdvp-accent font-medium text-sm mb-2">{profile?.job || "No Job Title"}</p>

                                {/* Identity Badges */}
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
                                    {(profile?.showAge || isOwnProfile) && profile?.age && (
                                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                                            {profile.age} YEARS OLD {(!profile.showAge && isOwnProfile) && "(Hidden)"}
                                        </span>
                                    )}

                                    {profile?.gender && profile.gender !== "Prefer not to say" && (
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                                            {profile.gender}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 rounded-full bg-fdvp-text/5 text-[10px] font-bold uppercase tracking-wider text-fdvp-text/70 border border-fdvp-text/10 flex items-center gap-1" title="Profile Visitors">
                                        <Eye size={12} />
                                        {profile?.visitorCount || 0} VISITORS
                                    </span>
                                </div>

                                {/* Bio Section */}
                                {profile?.bio && (
                                    <div className="bg-fdvp-text/5 p-4 rounded-xl mb-6 text-left">
                                        <h4 className="text-[10px] font-bold uppercase text-fdvp-text/50 mb-2">About</h4>
                                        <p className="text-sm text-fdvp-text italic leading-relaxed">"{profile.bio}"</p>
                                    </div>
                                )}

                                {/* Social Media Grid */}
                                <div className="flex flex-wrap justify-center gap-3 mb-8">
                                    {AVAILABLE_SOCIALS.map(social => {
                                        const link = profile?.[social.key];
                                        if (!link) return null;

                                        // Handle special case for Instagram/Discord usernames vs full URLs
                                        let href = link.trim();

                                        // 1. Discord is usually just a username#1234, not a link. We can't link to it easily.
                                        // Maybe copy to clipboard? For now, we'll make it a non-link or a "javascript:void(0)" with title.
                                        if (social.key === 'discord') {
                                            return (
                                                <div
                                                    key={social.key}
                                                    className="p-3 bg-fdvp-text/5 rounded-full text-indigo-400 cursor-help relative group/tooltip"
                                                    title={`Discord: ${link}`}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(link);
                                                        notify("Copied", "Discord ID copied to clipboard!", "success");
                                                    }}
                                                >
                                                    <social.icon size={18} />
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                        {link} (Click to Copy)
                                                    </span>
                                                </div>
                                            );
                                        }

                                        // 2. Specific Username handling (Instagram, Twitter/X, Giovanni, TikTok, YouTube Handle)
                                        // If it DOES NOT start with http, assume it's a username/handle.
                                        if (!href.startsWith('http')) {
                                            if (social.key === 'instagram') href = `https://instagram.com/${href.replace('@', '')}`;
                                            else if (social.key === 'twitter') href = `https://twitter.com/${href.replace('@', '')}`;
                                            else if (social.key === 'github') href = `https://github.com/${href}`;
                                            else if (social.key === 'tiktok') href = `https://tiktok.com/@${href.replace('@', '')}`; // TikTok needs @
                                            else if (social.key === 'youtube') href = `https://youtube.com/@${href.replace('@', '')}`;
                                            else if (social.key === 'facebook') href = `https://facebook.com/${href}`;
                                            else {
                                                // Default fallback: Try to assume it's a website and prepend https://
                                                href = `https://${href}`;
                                            }
                                        }

                                        return (
                                            <a
                                                key={social.key}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`p-3 bg-fdvp-text/5 rounded-full hover:text-white transition-all text-fdvp-text hover:scale-110 ${social.key === 'instagram' ? 'hover:bg-pink-500' : social.key === 'linkedin' ? 'hover:bg-blue-600' : social.key === 'facebook' ? 'hover:bg-blue-700' : social.key === 'youtube' ? 'hover:bg-red-600' : social.key === 'tiktok' ? 'hover:bg-pink-400' : 'hover:bg-gray-700'}`}
                                                title={social.label}
                                            >
                                                <social.icon size={18} />
                                            </a>
                                        );
                                    })}
                                </div>

                                {isOwnProfile && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full py-2.5 bg-fdvp-accent text-fdvp-bg rounded-xl hover:bg-fdvp-accent/90 transition-all font-bold text-sm flex justify-center gap-2 items-center shadow-lg shadow-fdvp-accent/20"
                                        >
                                            <Edit size={16} /> EDIT PROFILE
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all font-bold text-sm"
                                        >
                                            <LogOut size={16} /> LOGOUT
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            // --- EDIT FORM ---
                            <div className="text-left space-y-4 animate-in fade-in">
                                <h3 className="text-center font-bold text-fdvp-text-light mb-4 text-lg">Edit Identity</h3>

                                {/* Photo Upload */}
                                <div className="relative w-24 h-24 mx-auto mb-6 group">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-fdvp-accent">
                                        <img
                                            src={formData.photoURL || user?.photoURL || "https://via.placeholder.com/150"}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                                        />
                                    </div>
                                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-all">
                                        <Camera className="text-white" size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} disabled={isUploading} />
                                    </label>
                                    {isUploading && <div className="absolute inset-0 grid place-items-center bg-black/50 rounded-full"><Loader2 className="animate-spin text-white" /></div>}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div>
                                        <label className="text-xs font-bold text-fdvp-text/70 uppercase">Display Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-fdvp-bg px-3 py-2 rounded-lg text-fdvp-text-light border border-fdvp-text/10 focus:border-fdvp-accent focus:outline-none transition-colors text-sm"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-fdvp-text/70 uppercase">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full bg-fdvp-bg px-3 py-2 rounded-lg text-fdvp-text-light border border-fdvp-text/10 focus:border-fdvp-accent focus:outline-none transition-colors text-sm uppercase"
                                            value={formData.dob}
                                            onChange={(e) => {
                                                const newDob = e.target.value;
                                                // Calculate Age on change
                                                let age = null;
                                                if (newDob) {
                                                    const birthDate = new Date(newDob);
                                                    const today = new Date();
                                                    age = today.getFullYear() - birthDate.getFullYear();
                                                    const m = today.getMonth() - birthDate.getMonth();
                                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                        age--;
                                                    }
                                                }
                                                setFormData({ ...formData, dob: newDob, calculatedAge: age });
                                            }}
                                        />
                                        <p className="flex items-center gap-1 text-[10px] text-fdvp-text/40 mt-1">
                                            <Lock size={10} /> Private
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-fdvp-text/70 uppercase">Identity / Gender</label>
                                        <select
                                            className="w-full bg-fdvp-bg px-3 py-2 rounded-lg text-fdvp-text-light border border-fdvp-text/10 focus:border-fdvp-accent focus:outline-none transition-colors text-sm appearance-none"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="Prefer not to say">Prefer not to say</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-binary">Non-binary</option>
                                        </select>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id="editShowAge"
                                                checked={formData.showAge}
                                                onChange={(e) => setFormData({ ...formData, showAge: e.target.checked })}
                                                className="accent-fdvp-accent w-4 h-4"
                                            />
                                            <label htmlFor="editShowAge" className="text-xs font-bold text-fdvp-text/70 uppercase cursor-pointer select-none">
                                                Show Age ({formData.calculatedAge !== null ? formData.calculatedAge : (profile?.age || '?')}) on Profile
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-fdvp-text/70 uppercase">Main Role</label>
                                        <RoleSelector
                                            selectedRoles={formData.job.split(', ').filter(Boolean)}
                                            onChange={(roles) => setFormData({ ...formData, job: roles.join(', ') })}
                                            placeholder="+ Add Role"
                                            maxSelection={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-fdvp-text/70 uppercase">Bio / Status</label>
                                        <textarea
                                            className="w-full bg-fdvp-bg px-3 py-2 rounded-lg text-fdvp-text-light border border-fdvp-text/10 focus:border-fdvp-accent focus:outline-none transition-colors text-sm"
                                            rows={2}
                                            placeholder="Tell us about yourself..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-fdvp-text/10">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-xs font-bold text-fdvp-text/50 uppercase">Social Connections</p>
                                            <span className="text-[10px] text-fdvp-text/40">
                                                {AVAILABLE_SOCIALS.filter(s => formData[s.key] !== undefined && formData[s.key] !== "").length} / 5
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {AVAILABLE_SOCIALS.map((social) => {
                                                // Only show if user has "activated" this field (meaning it's in formData and they want to edit it)
                                                // Or simpler: Show if it has a value, OR if we selected it.
                                                // Current logic: We rely on formData having the key.
                                                // We need a way to track "active" fields even if empty, but formData has all keys initialized.
                                                // So we need a separate "activeFields" state? Or just use "value is not empty" to determine "active"?
                                                // The prompt asks for "Selection". So user selects, and then it appears.
                                                // Let's deduce "Active" by: value !== "" OR user explicitly added it.
                                                // Implementation: filter visible based on value !== "".
                                                // BUT user needs to see it to type into it. 
                                                // Correct approach: We need a derived list of "active keys".
                                                const val = formData[social.key];
                                                if (val === "" && !isSocialModalOpen) return null; // Wait this hides empty fields. We need a way to add.
                                                // Let's assume we maintain a list of keys that are "visible".
                                                return null;
                                            })}

                                            {/* Render Active Inputs */}
                                            {AVAILABLE_SOCIALS.filter(s => formData[s.key] !== "").map(social => (
                                                <div key={social.key} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                                    <social.icon size={16} className={`${social.color} shrink-0`} />
                                                    <input
                                                        type="text"
                                                        placeholder={social.placeholder}
                                                        className="w-full bg-fdvp-bg p-2 rounded text-xs border border-fdvp-text/10"
                                                        value={formData[social.key]}
                                                        onChange={(e) => setFormData({ ...formData, [social.key]: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => setFormData({ ...formData, [social.key]: "" })} // "Removing" clears value
                                                        className="text-fdvp-text/30 hover:text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add Button */}
                                            {AVAILABLE_SOCIALS.filter(s => formData[s.key] !== "").length < 5 && (
                                                <button
                                                    onClick={() => setIsSocialModalOpen(true)}
                                                    className="w-full py-2 border border-dashed border-fdvp-text/20 rounded-lg text-xs font-bold text-fdvp-text/60 hover:text-fdvp-accent hover:border-fdvp-accent/50 hover:bg-fdvp-accent/5 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={14} /> Add Connection
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleGetLocation}
                                            type="button"
                                            className="w-full py-2 bg-fdvp-primary/10 text-fdvp-primary border border-dashed border-fdvp-primary/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-fdvp-primary/20 mb-4"
                                        >
                                            <MapPin size={14} /> Update Location (GPS)
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-fdvp-text/50 uppercase">Province</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Jawa Barat"
                                                    className="w-full bg-fdvp-bg p-2 rounded text-xs border border-fdvp-text/10"
                                                    value={formData.province}
                                                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-fdvp-text/50 uppercase">City</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Bandung"
                                                    className="w-full bg-fdvp-bg p-2 rounded text-xs border border-fdvp-text/10"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-fdvp-bg border border-fdvp-text/10 rounded-xl text-xs font-bold text-fdvp-text">CANCEL</button>
                                    <button onClick={handleSaveProfile} className="flex-1 py-3 bg-fdvp-accent text-fdvp-bg rounded-xl text-xs font-bold hover:brightness-110">SAVE CHANGES</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: CONTENT */}
                <div className="md:col-span-2">
                    {/* Location Preview (Privacy Focused) */}
                    <div className="mt-12 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="text-fdvp-accent" size={28} />
                            <h2 className="text-3xl font-bold text-fdvp-text-light">Current Base</h2>
                        </div>
                        <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                <div className="w-full sm:w-1/2 h-48 bg-fdvp-bg rounded-xl overflow-hidden border border-fdvp-text/5 relative">
                                    {/* Static Non-Detailed Map Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-fdvp-primary/10 to-transparent z-10 pointer-events-none"></div>
                                    <img
                                        src="/images/indonesia.svg"
                                        alt="Base Location"
                                        className="w-full h-full object-contain opacity-20 dark:invert dark:brightness-200"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-fdvp-primary/20 rounded-full animate-ping absolute -inset-0"></div>
                                            <div className="relative bg-fdvp-primary p-3 rounded-full shadow-lg shadow-fdvp-primary/50">
                                                <MapPin size={24} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full text-center sm:text-left">
                                    <p className="text-sm uppercase tracking-widest text-fdvp-text/50 font-bold mb-1">Stationed in</p>
                                    <h3 className="text-2xl font-bold text-fdvp-text-light mb-2">
                                        {isEditing
                                            ? (formData.city && formData.province
                                                ? `${formData.city}, ${formData.province}`
                                                : formData.province || formData.city || "Fetching..."
                                            )
                                            : (profile?.city && profile?.province
                                                ? `${profile.city}, ${profile.province}`
                                                : profile?.province || profile?.city || "Unknown Location"
                                            )
                                        }
                                    </h3>
                                    <p className="text-sm text-fdvp-text leading-relaxed opacity-70">
                                        Member location is displayed at the city/province level to ensure operational security and individual privacy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event History / Tickets */}
                    <>
                        <div className="flex items-center gap-3 mb-8">
                            <Ticket className="text-fdvp-primary" size={28} />
                            <h2 className="text-3xl font-bold text-fdvp-text-light">{isOwnProfile ? "My Tickets" : "Event History"}</h2>
                        </div>

                        {loadingTickets ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-fdvp-accent" /></div>
                        ) : tickets.length === 0 ? (
                            <div className="bg-fdvp-card border border-dashed border-fdvp-text/10 rounded-2xl p-12 text-center">
                                <p className="text-fdvp-text mb-4">
                                    {isOwnProfile ? "You haven't registered for any events yet." : "This user hasn't participated in any events yet."}
                                </p>
                                {isOwnProfile && <button onClick={() => router.push('/event')} className="text-fdvp-accent font-bold hover:underline">Find Events &rarr;</button>}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {tickets.map((ticket) => (
                                    <div key={ticket.registrationId} className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-6 hover:border-fdvp-accent transition-all group shadow-sm hover:shadow-md">
                                        <div className="w-full sm:w-48 h-32 bg-fdvp-bg rounded-xl overflow-hidden shrink-0">
                                            <img src={ticket.eventImage} alt={ticket.eventTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-fdvp-text-light group-hover:text-fdvp-accent transition-colors line-clamp-1">{ticket.eventTitle}</h3>
                                                {isOwnProfile && (
                                                    <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 uppercase font-bold">
                                                        {ticket.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-fdvp-text space-y-1 mb-4">
                                                <div className="flex items-center gap-2"><Calendar size={12} /> {new Date(ticket.eventDate).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-2"><MapPin size={12} /> {ticket.eventLocation}</div>
                                            </div>

                                            {isOwnProfile && (
                                                <div className="mt-auto pt-3 border-t border-fdvp-text/5 flex justify-between items-center">
                                                    <span className="text-[10px] text-fdvp-text/40 font-mono tracking-widest">ID: {ticket.registrationId.substring(0, 8)}</span>
                                                    <button onClick={() => handleOpenTicket(ticket)} className="text-[10px] font-bold text-fdvp-primary border border-fdvp-primary/20 px-3 py-1.5 rounded hover:bg-fdvp-primary hover:text-white transition-all">
                                                        E-TICKET
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                </div>

            </div>

            {/* CROPPER MODAL */}
            {showCropper && imageSrc && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-fdvp-card w-full max-w-lg rounded-2xl overflow-hidden flex flex-col h-[500px]">
                        <div className="relative flex-1 bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="p-4 bg-fdvp-card border-t border-fdvp-text/10 space-y-4">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowCropper(false); setImageSrc(null); }}
                                    className="flex-1 py-3 rounded-xl border border-fdvp-text/20 text-fdvp-text font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={performCropAndUpload}
                                    disabled={isUploading}
                                    className="flex-1 py-3 rounded-xl bg-fdvp-primary text-white font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : "Save Photo"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SOCIAL SELECTION MODAL */}
            {isSocialModalOpen && (
                <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-fdvp-card border border-fdvp-text/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsSocialModalOpen(false)}
                            className="absolute right-4 top-4 text-fdvp-text/50 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-lg font-bold text-fdvp-text-light mb-1">Add Connection</h3>
                        <p className="text-xs text-fdvp-text mb-6">Choose a platform to display on your profile.</p>

                        <div className="grid grid-cols-3 gap-3">
                            {AVAILABLE_SOCIALS.map((social) => {
                                const isActive = formData[social.key] !== "";
                                return (
                                    <button
                                        key={social.key}
                                        disabled={isActive}
                                        onClick={() => {
                                            // Activate it by setting a placeholder if empty, or just focus it
                                            setFormData((prev: any) => ({ ...prev, [social.key]: prev[social.key] || " " }));
                                            // Note: We set " " (space) to make it "not empty" so it appears in the list.
                                            // The user should overwrite it. We'll trim on save.
                                            setIsSocialModalOpen(false);
                                        }}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isActive
                                            ? "opacity-40 bg-fdvp-bg border-transparent cursor-not-allowed"
                                            : "bg-fdvp-bg border-fdvp-text/5 hover:border-fdvp-accent hover:bg-fdvp-accent/10 hover:scale-105"
                                            }`}
                                    >
                                        <social.icon size={24} className={social.color} />
                                        <span className="text-[10px] font-bold text-fdvp-text-light">{social.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <TicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} ticket={selectedTicket} />
        </main>
    );
}