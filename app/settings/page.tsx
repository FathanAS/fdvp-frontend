"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sun, Moon, Monitor, Bell, BellOff, Lock, Globe, ChevronRight, Save, User, Laptop, Trash2, AlertTriangle, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import iziToast from "izitoast";

export default function SettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { muted, setMuted, notify } = useNotification();


    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    const [activeTab, setActiveTab] = useState("appearance");

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // ... (rest of the code)

    // Handle Delete Account
    const handleDeleteAccount = async () => {
        if (!user) return;
        if (deleteConfirmation !== "DELETE") {
            notify("Verification Failed", "Please type 'DELETE' exactly to confirm.", "error");
            return;
        }

        setIsDeleting(true);
        try {
            // 1. Delete Firestore User Document
            // Note: In a real app, you might want a Cloud Function to recursively delete subcollections (chats, tickets, etc.)
            // Here we just delete the main profile.
            await deleteDoc(doc(db, "users", user.uid));

            // 2. Delete Auth User
            await user.delete();

            notify("Account Deleted", "Your account has been permanently removed.", "success");
            router.push('/'); // Force redirect to Landing Page
        } catch (error: any) {
            console.error("Delete Account Error", error);
            if (error.code === 'auth/requires-recent-login') {
                notify("Security Check", "Please log out and log in again to perform this action.", "error");
            } else {
                notify("Error", "Failed to delete account. " + error.message, "error");
            }
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    // Initial Load
    // Initial Load (Handled by Context now, removing this effect for language)
    useEffect(() => {
        // ...
    }, []);

    // Handle Language
    const handleLanguageChange = (lang: string) => {
        setLanguage(lang as any);
        notify(t.common.success, lang === 'en' ? 'Language changed to English' : 'Bahasa diganti ke Indonesia', "success");
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

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light pb-20 font-sans selection:bg-fdvp-primary/30">
            <Navbar />

            {/* Background Blob */}
            <div className="fixed top-1/2 left-0 w-96 h-96 bg-fdvp-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-fdvp-accent/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto px-6 pt-32 relative z-10">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-3 tracking-tight">{t.settings.title}</h1>
                    <p className="text-fdvp-text">{t.settings.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* SIDEBAR TABS */}
                    <div className="space-y-2">
                        {[
                            { id: "appearance", icon: <Monitor size={18} />, label: t.settings.tabs.appearance },
                            { id: "notifications", icon: muted ? <BellOff size={18} /> : <Bell size={18} />, label: t.settings.tabs.notifications },
                            { id: "security", icon: <Lock size={18} />, label: t.settings.tabs.security },
                            { id: "language", icon: <Globe size={18} />, label: t.settings.tabs.language }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === tab.id
                                    ? "bg-fdvp-primary text-white font-bold shadow-lg shadow-fdvp-primary/20 scale-[1.02]"
                                    : "bg-fdvp-card hover:bg-fdvp-text/5 text-fdvp-text hover:text-fdvp-text-light border border-transparent hover:border-fdvp-text/5"}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="md:col-span-3">

                        {/* APPEARANCE */}
                        {activeTab === "appearance" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-3xl p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-fdvp-text-light"><Monitor className="text-fdvp-primary" /> {t.settings.appearance.title}</h2>
                                <p className="text-fdvp-text text-sm mb-8">{t.settings.appearance.subtitle}</p>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { id: 'light', icon: <Sun size={24} />, label: t.settings.appearance.light },
                                        { id: 'dark', icon: <Moon size={24} />, label: t.settings.appearance.dark },
                                        { id: 'system', icon: <Laptop size={24} />, label: t.settings.appearance.system }
                                    ].map((tItem) => (
                                        <button
                                            key={tItem.id}
                                            onClick={() => setTheme(tItem.id)}
                                            className={`group p-6 rounded-2xl border flex flex-col items-center gap-4 transition-all duration-300 ${theme === tItem.id
                                                ? 'border-fdvp-primary bg-fdvp-primary/10 shadow-lg shadow-fdvp-primary/10'
                                                : 'border-fdvp-text/10 bg-fdvp-bg hover:bg-fdvp-text/5 hover:border-fdvp-text/20 text-fdvp-text hover:text-fdvp-text-light'}`}
                                        >
                                            <div className={`transition-transform duration-500 group-hover:scale-110 ${theme === tItem.id ? "text-fdvp-primary" : "text-current"}`}>
                                                {tItem.icon}
                                            </div>
                                            <span className={`font-bold text-sm ${theme === tItem.id ? "text-fdvp-text-light" : "text-fdvp-text group-hover:text-fdvp-text-light"}`}>{tItem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeTab === "notifications" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-3xl p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-fdvp-text-light"><Bell className="text-fdvp-primary" /> Notification Settings</h2>
                                <p className="text-fdvp-text text-sm mb-8">Manage how you receive alerts.</p>

                                <div className="flex items-center justify-between p-6 bg-fdvp-bg rounded-2xl border border-fdvp-text/10 hover:border-fdvp-text/20 transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-full transition-colors ${muted ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {muted ? <BellOff size={24} /> : <Bell size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1 text-fdvp-text-light">{t.settings.notifications.pushTitle}</h3>
                                            <p className="text-sm text-fdvp-text/70">
                                                {muted ? t.settings.notifications.pushMuted : t.settings.notifications.pushEnabled}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!muted}
                                            onChange={() => {
                                                setMuted(!muted);
                                                notify("Settings Updated", `Notifications ${muted ? "Enabled" : "Muted"}`, "success");
                                            }}
                                        />
                                        <div className="w-14 h-8 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/80 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-fdvp-primary peer-checked:shadow-[0_0_15px_-3px_rgba(20,255,236,0.3)] group-hover:after:bg-white"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* SECURITY */}
                        {activeTab === "security" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-3xl p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-fdvp-text-light"><Lock className="text-fdvp-primary" /> {t.settings.security.title}</h2>
                                <p className="text-fdvp-text text-sm mb-8">{t.settings.security.subtitle}</p>

                                <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-fdvp-text mb-2 tracking-widest">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-xl p-4 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:border-fdvp-primary focus:bg-fdvp-bg focus:outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-fdvp-text mb-2 tracking-widest">New Password</label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-xl p-4 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:border-fdvp-primary focus:bg-fdvp-bg focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-fdvp-text mb-2 tracking-widest">Confirm</label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-xl p-4 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:border-fdvp-primary focus:bg-fdvp-bg focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passLoading}
                                        className="bg-fdvp-primary hover:bg-white hover:text-black text-white px-8 py-4 rounded-xl font-bold w-full flex justify-center items-center gap-3 transition-all shadow-lg shadow-fdvp-primary/20 hover:scale-[1.02]"
                                    >
                                        {passLoading ? "Updating..." : <><Save size={20} /> Update Password</>}
                                    </button>
                                </form>

                                {/* DANGER ZONE */}
                                <div className="mt-12 pt-8 border-t border-fdvp-text/10 animate-in fade-in slide-in-from-bottom-8">
                                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                                        <div className="p-3 bg-red-500/10 text-red-500 rounded-full shrink-0">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-red-400 mb-1">Danger Zone</h3>
                                            <p className="text-sm text-fdvp-text/70 mb-4">
                                                Deleting your account is permanent. All your data including profile, tickets, and history will be wiped out immediately.
                                            </p>
                                            <button
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-sm transition-all border border-red-500/20"
                                            >
                                                Delete My Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DELETE ACCOUNT MODAL */}
                        {isDeleteModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                                <div className="bg-fdvp-card border border-fdvp-text/10 w-full max-w-md rounded-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="absolute top-4 right-4 text-fdvp-text/50 hover:text-fdvp-text-light transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                                        <Trash2 size={32} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-center text-fdvp-text-light mb-2">Delete Account?</h2>
                                    <p className="text-center text-fdvp-text/70 text-sm mb-6">
                                        This action cannot be undone. To confirm, please type <span className="font-bold text-red-400 select-all">DELETE</span> in the box below.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-fdvp-text mb-2 tracking-widest pl-1">Verification</label>
                                            <input
                                                type="text"
                                                placeholder="Type DELETE"
                                                value={deleteConfirmation}
                                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-xl p-4 text-fdvp-text-light focus:border-red-500 focus:bg-red-500/5 focus:outline-none transition-all font-mono"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                className="flex-1 py-3 border border-fdvp-text/10 text-fdvp-text rounded-xl hover:bg-fdvp-text/5 font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? "Deleting..." : "Confirm Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LANGUAGE */}
                        {activeTab === "language" && (
                            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-3xl p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-fdvp-text-light"><Globe className="text-fdvp-primary" /> {t.settings.language.title}</h2>
                                <p className="text-fdvp-text text-sm mb-8">{t.settings.language.subtitle}</p>

                                <div className="space-y-4">
                                    {[
                                        { code: 'en', flag: '🇺🇸', label: 'English (US)', sub: 'English' },
                                        { code: 'id', flag: '��', label: 'Bahasa Indonesia', sub: 'Indonesian' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`group w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${language === lang.code
                                                ? 'border-fdvp-primary bg-fdvp-primary/10 shadow-lg shadow-fdvp-primary/10'
                                                : 'border-fdvp-text/10 bg-fdvp-bg hover:bg-fdvp-text/5 hover:border-fdvp-text/20'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl filter drop-shadow-md">{lang.flag}</div>
                                                <div className="text-left">
                                                    <p className={`font-bold ${language === lang.code ? 'text-fdvp-text-light' : 'text-fdvp-text group-hover:text-fdvp-text-light'}`}>{lang.label}</p>
                                                    <p className="text-sm opacity-50 text-fdvp-text">{lang.sub}</p>
                                                </div>
                                            </div>
                                            {language === lang.code && <div className="w-8 h-8 rounded-full bg-fdvp-primary text-black flex items-center justify-center"><ChevronRight size={18} /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}
