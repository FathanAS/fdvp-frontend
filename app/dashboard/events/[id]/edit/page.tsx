"use client";
import { useState, useEffect } from "react";
import { Upload, Calendar, MapPin, Loader2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import StatusSelector from "@/components/StatusSelector";
import LocationSelector from "@/components/LocationSelector";

export default function EditEventPage() {
    const { id } = useParams();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // State Data Form
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [locationName, setLocationName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("upcoming");

    // State Gambar & Map
    const [banner, setBanner] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

    const { user } = useAuth();
    const router = useRouter();

    // --- FETCH DATA LAMA ---
    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events/${id}`);
                const data = await res.json();

                setTitle(data.title);
                setDate(new Date(data.date).toISOString().slice(0, 16));
                setLocationName(data.location);
                setDescription(data.description);
                setPreview(data.imageHeader);

                if (data.latitude && data.longitude) {
                    setCoords({ lat: data.latitude, lng: data.longitude });
                }
                if (data.status) setStatus(data.status);
            } catch (error) {
                console.error("Gagal ambil data event", error);
            } finally {
                setFetching(false);
            }
        };

        fetchEventData();
    }, [id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBanner(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = preview;

            if (banner) {
                const imageFormData = new FormData();
                imageFormData.append("file", banner);
                imageFormData.append("upload_preset", "fdvp_events"); // Fixed preset name
                const cloudName = "difdnmf2b"; // Fixed cloud name

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: imageFormData
                });
                const uploadData = await uploadRes.json();
                finalImageUrl = uploadData.secure_url;
            }

            const eventData = {
                title,
                date,
                location: locationName,
                description,
                imageHeader: finalImageUrl,
                latitude: coords?.lat || 0,
                longitude: coords?.lng || 0,
                status: status,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData),
            });

            if (res.ok) {
                notify("Success", "Event updated successfully!", "success");
                router.push("/dashboard/events");
            } else {
                throw new Error("Gagal update database");
            }

        } catch (error: any) {
            notify("Error", "Failed to update event: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center p-20 text-fdvp-text h-96">
            <Loader2 className="animate-spin mb-4 text-fdvp-primary" size={32} />
            <span className="uppercase tracking-widest text-xs">Loading Event Data...</span>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/events" className="p-2 bg-fdvp-text/5 hover:bg-fdvp-text/10 rounded-full transition-colors border border-fdvp-text/5 text-fdvp-text hover:text-fdvp-text-light">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-fdvp-text-light tracking-tight">Edit Event</h2>
                    <p className="text-fdvp-text text-sm">Update event details and status.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-fdvp-text/5 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-fdvp-text/5 shadow-2xl space-y-8">

                {/* GAMBAR */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Event Banner</label>
                    <div className="relative border-2 border-dashed border-fdvp-text/10 rounded-2xl overflow-hidden group hover:border-fdvp-primary/50 transition-all bg-fdvp-text/5 hover:bg-fdvp-text/10 h-72 flex flex-col items-center justify-center">
                        <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="p-10 text-center text-fdvp-text/40 group-hover:text-fdvp-text-light transition-colors">
                                <Upload size={32} className="mx-auto mb-2" />
                                <span className="text-sm font-bold">Click to Change Banner</span>
                            </div>
                        )}
                        <div className="absolute top-2 right-2 bg-fdvp-card/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-fdvp-text-light pointer-events-none border border-fdvp-text/10">
                            Current Banner
                        </div>
                    </div>
                </div>

                {/* TITLE */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Event Title</label>
                    <input
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        type="text" className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg font-medium" required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1 flex items-center gap-2"><Calendar size={14} /> Date</label>
                        <input
                            value={date} onChange={(e) => setDate(e.target.value)}
                            type="datetime-local" className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light focus:outline-none focus:border-fdvp-primary/50 transition-all" required
                        />
                    </div>

                    {/* STATUS DROPDOWN */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Status</label>
                        <StatusSelector status={status} onChange={setStatus} />
                    </div>

                    <div className="space-y-6 md:col-span-2">
                        {/* LOCATION SELECTOR */}
                        <div className="space-y-4">
                            <LocationSelector
                                initialAddress={locationName}
                                initialLat={coords?.lat || 0}
                                initialLng={coords?.lng || 0}
                                onLocationChange={(data) => {
                                    setCoords({ lat: data.lat, lng: data.lng });
                                    setLocationName(data.address);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Description</label>
                    <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        rows={6} className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light resize-none placeholder:text-fdvp-text/20 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all" required
                    ></textarea>
                </div>

                <div className="pt-4">
                    <button disabled={loading} className="w-full bg-gradient-to-r from-fdvp-accent to-fdvp-primary hover:to-fdvp-accent text-fdvp-bg font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-fdvp-primary/20 hover:scale-[1.01] flex justify-center items-center gap-2 text-base">
                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> SAVE CHANGES</>}
                    </button>
                </div>

            </form>
        </div>
    );
}