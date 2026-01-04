"use client";
import { useState } from "react";
import { Upload, Calendar, MapPin, Loader2, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LocationSelector from "@/components/LocationSelector";
import { useNotification } from "@/context/NotificationContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const [banner, setBanner] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Date State
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // State Lokasi
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");

  const { user } = useAuth();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBanner(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    if (!banner) return notify("Validation Error", "Please upload an event banner!", "error");
    if (!locationName) return notify("Validation Error", "Please select a location!", "error");

    if (!selectedDate || selectedDate < new Date()) {
      return notify("Validation Error", "Event date cannot be in the past!", "error");
    }

    setLoading(true);

    try {
      // --- 1. UPLOAD KE CLOUDINARY ---
      const imageFormData = new FormData();
      imageFormData.append("file", banner);
      imageFormData.append("upload_preset", "fdvp_events");
      const cloudName = "difdnmf2b";

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: imageFormData
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.secure_url) {
        throw new Error("Gagal upload gambar ke Cloudinary");
      }

      const imageUrl = uploadData.secure_url;
      console.log("Image Uploaded:", imageUrl);

      // --- 2. KIRIM DATA KE BACKEND NESTJS ---

      const eventData = {
        title: formData.get("title"),
        date: selectedDate.toISOString(),
        location: locationName,
        description: formData.get("description"),
        imageHeader: imageUrl,
        createdBy: user?.uid,
        status: "upcoming",
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        notify("Success", "Event created successfully!", "success");
        router.push("/dashboard/events");
      } else {
        throw new Error("Gagal menyimpan ke database");
      }
    } catch (error: any) {
      console.error(error);
      notify("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/events" className="p-2 bg-fdvp-text/5 hover:bg-fdvp-text/10 rounded-full transition-colors border border-fdvp-text/5 text-fdvp-text hover:text-fdvp-text-light">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-fdvp-text-light tracking-tight">Create New Event</h2>
          <p className="text-fdvp-text text-sm">Publish a new activity for the community.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-fdvp-text/5 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-fdvp-text/5 shadow-2xl space-y-8">
        {/* UI UPLOAD GAMBAR */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Event Banner</label>
          <div className="relative border-2 border-dashed border-fdvp-text/10 rounded-2xl overflow-hidden group hover:border-fdvp-primary/50 transition-all bg-fdvp-text/5 hover:bg-fdvp-text/10 w-full h-72 flex flex-col items-center justify-center">
            <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />

            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-4 text-fdvp-text/40 group-hover:text-fdvp-text-light transition-colors">
                <div className="w-16 h-16 rounded-full bg-fdvp-text/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div>
                  <span className="font-bold text-lg block mb-1">Upload Event Banner</span>
                  <span className="text-xs opacity-50 block">JPG/PNG (Rec: 1200x600px)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Event Title</label>
          <input name="title" type="text" placeholder="e.g. Annual Developer Meetup 2025" className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg font-medium" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <div className="custom-datepicker-input-container relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  if (!date) return;

                  const newDate = new Date(date);
                  // Maintain time from previous state if exists
                  if (selectedDate) {
                    newDate.setHours(selectedDate.getHours());
                    newDate.setMinutes(selectedDate.getMinutes());
                  }

                  // Strict Date Validation (Midnight check)
                  const todayMidnight = new Date();
                  todayMidnight.setHours(0, 0, 0, 0);

                  if (date < todayMidnight) {
                    notify("Validation Error", "Cannot select a past date!", "error");
                    return;
                  }

                  setSelectedDate(newDate);
                }}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select Date"
                className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 pl-12 text-fdvp-text-light focus:outline-none focus:border-fdvp-primary/50 transition-all cursor-pointer font-medium"
                wrapperClassName="w-full"
                minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                preventOpenOnFocus={true}
                onKeyDown={(e) => e.preventDefault()}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/30 pointer-events-none">
                <Calendar size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Clock size={14} /> Time
            </label>
            <div className="custom-datepicker-input-container relative">
              <input
                type="time"
                value={selectedDate ? selectedDate.toTimeString().slice(0, 5) : ""}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":").map(Number);
                  const newDate = new Date(selectedDate || new Date());
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);

                  // Validation: Prevent past time selection if date is today
                  if (newDate < new Date()) {
                    notify("Validation Error", "Cannot select a past time!", "error");
                    return;
                  }

                  setSelectedDate(newDate);
                }}
                className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 pl-12 text-fdvp-text-light focus:outline-none focus:border-fdvp-primary/50 transition-all cursor-pointer font-medium appearance-none"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/30 pointer-events-none">
                <Clock size={20} />
              </div>
            </div>
          </div>

          <input type="hidden" name="date" value={selectedDate?.toISOString() || ''} />
        </div>

        {/* LOCATION SELECTOR (FULL WIDTH) */}
        <div className="space-y-4">
          <LocationSelector
            onLocationChange={(data) => {
              setCoords({ lat: data.lat, lng: data.lng });
              setLocationName(data.address);
            }}
          />
          <input type="hidden" name="location" value={locationName} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Description</label>
          <textarea name="description" rows={6} placeholder="Describe what the event is about..." className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light resize-none placeholder:text-fdvp-text/20 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all" required></textarea>
        </div>

        <div className="pt-4">
          <button disabled={loading} className="w-full bg-gradient-to-r from-fdvp-primary to-fdvp-accent hover:to-fdvp-primary text-fdvp-bg font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-fdvp-primary/20 hover:scale-[1.01] flex justify-center items-center gap-2 text-base">
            {loading ? <Loader2 className="animate-spin" /> : "Publish Event Now"}
          </button>
        </div>
      </form>
    </div>
  );
}