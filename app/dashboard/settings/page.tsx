"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "next-themes";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Sun, Moon, Monitor, Bell, BellOff, Lock, Globe, ChevronRight, Save, User, Laptop } from "lucide-react";
import Navbar from "@/components/Navbar";
import iziToast from "izitoast";

export default function SettingsPage() {
    const { user } = useAuth();
    const { muted, setMuted, notify } = useNotification();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [language, setLanguage] = useState("en"); // Default 'en' for now
    const [activeTab, setActiveTab] = useState("appearance");

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem("fdvp_language");
        if (savedLang) setLanguage(savedLang);
    }, []);

    // Handle Language
    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem("fdvp_language", lang);
        notify("Language Changed", `Language set to ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}`, "success");
    };

    // Handle Password Change
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        if (newPassword !== confirmPassword) {
            notify("Error", "New passwords do not match!", "error");
            return;
        }

        if (newPassword.length < 6) {
            notify("Error", "Password must be at least 6 characters.", "error");
            return;
        }

        setPassLoading(true);
        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, newPassword);

            notify("Success", "Password updated successfully!", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            notify("Error", error.message || "Failed to update password. Check current password.", "error");
        } finally {
            setPassLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light flex flex-col">
            <div className="max-w-4xl w-full mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-fdvp-text mb-8">Manage your preferences and account settings.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* SIDEBAR TABS */}
                    <div className="space-y-2">
                        {[
                            { id: "appearance", label: "Appearance", icon: <Monitor size={18} /> },
                            { id: "notifications", label: "Notifications", icon: muted ? <BellOff size={18} /> : <Bell size={18} /> },
                            { id: "security", label: "Security", icon: <Lock size={18} /> },
                            { id: "language", label: "Language", icon: <Globe size={18} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === tab.id
                                    ? "bg-fdvp-primary text-fdvp-bg font-bold shadow-md"
                                    : "text-fdvp-text hover:bg-fdvp-card hover:text-fdvp-text-light"
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="md:col-span-3">

                        {/* APPEARANCE */}
                        {activeTab === "appearance" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Monitor className="text-fdvp-accent" /> Theme Preference</h2>
                                <p className="text-fdvp-text text-sm mb-6">Choose how the application looks for you.</p>

                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-fdvp-accent bg-fdvp-accent/10' : 'border-fdvp-text/10 hover:border-fdvp-text/30'}`}
                                    >
                                        <Sun size={24} className={theme === 'light' ? "text-fdvp-accent" : "text-fdvp-text"} />
                                        <span className="font-bold text-sm">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-fdvp-accent bg-fdvp-accent/10' : 'border-fdvp-text/10 hover:border-fdvp-text/30'}`}
                                    >
                                        <Moon size={24} className={theme === 'dark' ? "text-fdvp-accent" : "text-fdvp-text"} />
                                        <span className="font-bold text-sm">Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("system")}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-fdvp-accent bg-fdvp-accent/10' : 'border-fdvp-text/10 hover:border-fdvp-text/30'}`}
                                    >
                                        <Laptop size={24} className={theme === 'system' ? "text-fdvp-accent" : "text-fdvp-text"} />
                                        <span className="font-bold text-sm">System</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeTab === "notifications" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Bell className="text-fdvp-accent" /> Notification Settings</h2>
                                <p className="text-fdvp-text text-sm mb-6">Control your notification preferences.</p>

                                <div className="flex items-center justify-between p-4 bg-fdvp-bg/50 rounded-xl border border-fdvp-text/10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${muted ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                            {muted ? <BellOff size={24} /> : <Bell size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Push Notifications & Sounds</h3>
                                            <p className="text-xs text-fdvp-text">
                                                {muted ? "Notifications are currently muted." : "You will receive notifications and sounds."}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!muted}
                                            onChange={() => {
                                                setMuted(!muted);
                                                notify("Settings Updated", `Notifications ${muted ? "Enabled" : "Muted"}`, "success");
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fdvp-accent"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* SECURITY */}
                        {activeTab === "security" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="text-fdvp-accent" /> Change Password</h2>
                                <p className="text-fdvp-text text-sm mb-6">Ensure your account is secure with a strong password.</p>

                                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-fdvp-text mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-fdvp-bg border border-fdvp-text/20 rounded-lg p-3 text-fdvp-text-light focus:border-fdvp-accent focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-fdvp-text mb-1">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-fdvp-bg border border-fdvp-text/20 rounded-lg p-3 text-fdvp-text-light focus:border-fdvp-accent focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-fdvp-text mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-fdvp-bg border border-fdvp-text/20 rounded-lg p-3 text-fdvp-text-light focus:border-fdvp-accent focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passLoading}
                                        className="bg-fdvp-primary hover:bg-fdvp-accent hover:text-fdvp-bg text-fdvp-bg px-6 py-3 rounded-lg font-bold w-full flex justify-center items-center gap-2 transition-all"
                                    >
                                        {passLoading ? "Updating..." : <><Save size={18} /> Update Password</>}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* LANGUAGE */}
                        {activeTab === "language" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Globe className="text-fdvp-accent" /> Language Settings</h2>
                                <p className="text-fdvp-text text-sm mb-6">Select your preferred language.</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleLanguageChange("en")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${language === 'en' ? 'border-fdvp-accent bg-fdvp-accent/10 text-fdvp-primary' : 'border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-text/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">🇺🇸</div>
                                            <div className="text-left">
                                                <p className="font-bold">English (US)</p>
                                                <p className="text-xs opacity-70">English</p>
                                            </div>
                                        </div>
                                        {language === 'en' && <ChevronRight className="text-fdvp-accent" />}
                                    </button>

                                    <button
                                        onClick={() => handleLanguageChange("id")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${language === 'id' ? 'border-fdvp-accent bg-fdvp-accent/10 text-fdvp-primary' : 'border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-text/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">🇮🇩</div>
                                            <div className="text-left">
                                                <p className="font-bold">Bahasa Indonesia</p>
                                                <p className="text-xs opacity-70">Indonesian</p>
                                            </div>
                                        </div>
                                        {language === 'id' && <ChevronRight className="text-fdvp-accent" />}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}
