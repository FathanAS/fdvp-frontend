"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, ArrowRight, UserCheck, MapPin, Briefcase, Calendar, Lock } from "lucide-react";
import RoleSelector from "@/components/RoleSelector"; // Path might need adjustment depending on file structure

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Form States
    const [dob, setDob] = useState<string>(""); // YYYY-MM-DD
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const [showAge, setShowAge] = useState(true);
    const [gender, setGender] = useState("Prefer not to say");
    const [roles, setRoles] = useState<string[]>([]); // Detailed Roles/Interests
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");

    useEffect(() => {
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setCalculatedAge(age);
        } else {
            setCalculatedAge(null);
        }
    }, [dob]);

    // ... code ...



    // Socials
    const [instagram, setInstagram] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [website, setWebsite] = useState("");

    // Location Helper State
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser: any) => {
            if (currentUser) {
                // Check if user already completed onboarding
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    // Optional: If "onboardingCompleted" flag exists, redirect to dashboard
                    if (userData.onboardingCompleted) {
                        router.replace("/dashboard");
                        return;
                    }
                    setUser({ ...currentUser, ...userData });
                } else {
                    setUser(currentUser);
                }
                setLoading(false);
            } else {
                router.replace("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Fetch Address from Nominatim (OpenStreetMap)
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.address) {
                            const detectedCity = data.address.city || data.address.town || data.address.village || "";
                            const detectedProvince = data.address.state || data.address.region || "";
                            setCity(detectedCity);
                            setProvince(detectedProvince);
                        }
                    })
                    .catch(() => alert("Failed to fetch address details."))
                    .finally(() => setGettingLocation(false));
            },
            (error) => {
                console.error(error);
                setGettingLocation(false);
                alert("Unable to retrieve your location");
            }
        );
    };

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                dob: dob, // Private DOB
                age: calculatedAge, // Publicly filterable age (if showAge is true)
                showAge: showAge,
                gender: gender,
                // Assign first role as 'job' if available, otherwise 'Member'
                job: roles.join(', '),
                tags: roles,

                // Location
                province,
                city,

                // Socials
                instagram,
                github,
                linkedin,
                website,

                // Mark flag
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-fdvp-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-fdvp-accent" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-fdvp-bg flex flex-col items-center justify-center p-6 text-fdvp-text-light relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fdvp-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fdvp-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10">
                {/* Progress Indicators */}
                <div className="flex justify-between mb-8 px-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? "bg-fdvp-accent" : "bg-fdvp-text/10"}`} />
                    ))}
                </div>

                <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">

                    {/* STEP 1: IDENTITY (DOB, ShowAge, Gender) */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-fdvp-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-fdvp-primary">
                                    <UserCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Identity Check</h2>
                                <p className="text-fdvp-text/60 text-sm mt-2">Let others know a bit about you.</p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-fdvp-text/50 uppercase ml-1 block mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-xl p-4 text-center text-xl font-bold focus:outline-none focus:border-fdvp-accent transition-all uppercase"
                                        autoFocus
                                    />
                                    <p className="text-center text-xs text-fdvp-text/40 mt-2 font-medium flex items-center justify-center gap-1">
                                        <Lock size={12} /> Your Birthday is Private
                                    </p>

                                    {calculatedAge !== null && (
                                        <div className="mt-4 text-center animate-in fade-in slide-in-from-top-2">
                                            <div className="inline-block px-4 py-2 bg-fdvp-accent/10 rounded-lg border border-fdvp-accent/20">
                                                <span className="text-fdvp-text/60 text-xs uppercase font-bold mr-2">Calculated Age</span>
                                                <span className="text-fdvp-accent font-bold text-lg">{calculatedAge} Years Old</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showAge"
                                            checked={showAge}
                                            onChange={(e) => setShowAge(e.target.checked)}
                                            className="accent-fdvp-accent w-4 h-4"
                                        />
                                        <label htmlFor="showAge" className="text-sm text-fdvp-text cursor-pointer select-none">Show Age on Profile</label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-fdvp-text/50 uppercase ml-1 block mb-2">Gender</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setGender(g)}
                                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${gender === g
                                                    ? 'bg-fdvp-primary/10 border-fdvp-primary text-fdvp-primary'
                                                    : 'bg-fdvp-bg border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-text/5'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!dob}
                                className="w-full py-3 bg-fdvp-accent text-fdvp-bg font-bold rounded-xl hover:bg-fdvp-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: LOCATION */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                    <MapPin size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Where are you based?</h2>
                                <p className="text-fdvp-text/60 text-sm mt-2">Connect with developers near you.</p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleGetLocation}
                                    disabled={gettingLocation}
                                    className="w-full py-3 border border-dashed border-fdvp-text/20 rounded-xl flex items-center justify-center gap-2 text-fdvp-text/70 hover:text-fdvp-accent hover:border-fdvp-accent/50 hover:bg-fdvp-accent/5 transition-all text-sm font-bold"
                                >
                                    {gettingLocation ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                                    {gettingLocation ? "Detecting..." : "Auto-Detect Location"}
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">Province</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Jawa Barat"
                                            value={province}
                                            onChange={(e) => setProvince(e.target.value)}
                                            className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">City</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bandung"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 border border-fdvp-text/10 text-fdvp-text rounded-xl hover:bg-fdvp-text/5 font-bold transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-[2] py-3 bg-fdvp-accent text-fdvp-bg font-bold rounded-xl hover:bg-fdvp-accent/90 transition-all flex items-center justify-center gap-2"
                                >
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: ROLE ONLY (Primary Job Removed) */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
                                    <Briefcase size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">What do you do?</h2>
                                <p className="text-fdvp-text/60 text-sm mt-2">Select up to 3 roles that define you.</p>
                            </div>

                            <div className="pt-2">
                                <RoleSelector
                                    selectedRoles={roles}
                                    onChange={setRoles}
                                    placeholder="Search specific role..."
                                    maxSelection={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 border border-fdvp-text/10 text-fdvp-text rounded-xl hover:bg-fdvp-text/5 font-bold transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={roles.length === 0}
                                    className="flex-[2] py-3 bg-fdvp-accent text-fdvp-bg font-bold rounded-xl hover:bg-fdvp-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SOCIAL MEDIA */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                                    <UserCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Stay Connected</h2>
                                <p className="text-fdvp-text/60 text-sm mt-2">Add your socials (Username or Link).</p>
                            </div>

                            <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">Instagram</label>
                                    <input type="text" placeholder="@username or https://..." value={instagram} onChange={e => setInstagram(e.target.value)} className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">GitHub</label>
                                    <input type="text" placeholder="username" value={github} onChange={e => setGithub(e.target.value)} className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">LinkedIn</label>
                                    <input type="text" placeholder="Profile URL" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase text-fdvp-text/50 font-bold ml-1">Website</label>
                                    <input type="text" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-fdvp-bg p-3 rounded-xl border border-fdvp-text/10 text-sm focus:border-fdvp-accent focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 py-3 border border-fdvp-text/10 text-fdvp-text rounded-xl hover:bg-fdvp-text/5 font-bold transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleFinish}
                                    disabled={saving}
                                    className="flex-[2] py-3 bg-gradient-to-r from-fdvp-accent to-fdvp-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-fdvp-accent/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                    Finish
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
