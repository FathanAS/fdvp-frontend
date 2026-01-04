"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    Users,
    ShieldAlert,
    LayoutDashboard,
    ArrowLeft,
    Settings,
    Menu,
    X,
    Calendar,
    ScanLine
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (!["admin", "superadmin", "staff", "owner", "administrator"].includes(role || "")) {
                router.push("/");
            }
        }
    }, [user, role, loading, router]);

    if (loading || !user || !["admin", "superadmin", "staff", "owner", "administrator"].includes(role || "")) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-fdvp-bg text-fdvp-text-light">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-fdvp-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-light tracking-widest uppercase opacity-70">Authenticating Access</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        {
            title: "Overview",
            path: "/dashboard",
            icon: <LayoutDashboard size={18} />,
            roles: ["admin", "superadmin", "staff", "owner", "administrator"],
        },
        {
            title: "User Management",
            path: "/dashboard/users",
            icon: <Users size={18} />,
            roles: ["admin", "superadmin", "owner", "administrator"],
        },
        {
            title: "Manage Events",
            path: "/dashboard/events",
            icon: <Calendar size={18} />,
            roles: ["admin", "superadmin", "staff", "owner", "administrator"],
        },
        {
            title: "Scan Tickets",
            path: "/dashboard/scan",
            icon: <ScanLine size={18} />,
            roles: ["admin", "superadmin", "staff", "owner", "administrator"],
        },
        {
            title: "Admin Management",
            path: "/dashboard/admins",
            icon: <ShieldAlert size={18} />,
            roles: ["superadmin", "owner", "administrator"],
        },
    ];

    return (
        <div className="flex h-screen bg-fdvp-bg text-fdvp-text-light overflow-hidden selection:bg-fdvp-primary/30 font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-fdvp-card/95 backdrop-blur-2xl border-r border-fdvp-text/5 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:relative md:translate-x-0 shadow-2xl`}
            >
                <div className="h-full flex flex-col p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="flex items-center gap-2">
                            {/* Light Mode Logo */}
                            <img src="/images/logo-fdvp-black.png" alt="FDVP Panel" className="h-8 w-auto object-contain dark:hidden block" />
                            {/* Dark Mode Logo */}
                            <img src="/images/logo-fdvp-white.png" alt="FDVP Panel" className="h-8 w-auto object-contain hidden dark:block" />
                            <span className="text-fdvp-primary font-normal ml-1">Panel</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden text-fdvp-text hover:text-fdvp-text-light"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User Info Card */}
                    <div className="mb-8 p-3 bg-fdvp-text/5 rounded-2xl border border-fdvp-text/5 flex items-center gap-3 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-full border border-fdvp-text/10 overflow-hidden shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-fdvp-card flex items-center justify-center text-xs font-bold text-fdvp-text">
                                    {(user.displayName || role || "U").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-fdvp-text-light">{user.displayName || "User"}</p>
                            <p className="text-[10px] uppercase tracking-wider text-fdvp-primary font-bold truncate">{role}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            if (item.roles.includes(role || "")) {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                            ? "bg-fdvp-primary text-fdvp-bg shadow-lg shadow-fdvp-primary/20"
                                            : "text-fdvp-text hover:bg-fdvp-text/5 hover:text-fdvp-text-light"
                                            }`}
                                    >
                                        <span className={`transition-colors ${isActive ? "text-fdvp-bg" : "text-fdvp-text group-hover:text-fdvp-text-light"}`}>{item.icon}</span>
                                        <span className="text-sm font-medium">{item.title}</span>
                                    </Link>
                                );
                            }
                            return null;
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto pt-6 border-t border-fdvp-text/5">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-sm font-medium"
                        >
                            <ArrowLeft size={18} />
                            <span>Exit Panel</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-fdvp-bg">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-fdvp-card/80 backdrop-blur-xl border-b border-fdvp-text/10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-fdvp-text-light">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-fdvp-text-light">Dashboard</span>
                    <div className="w-6" />
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-6 md:p-10 relative">
                    {/* Decorative Background Blob for Dashboard */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-fdvp-primary/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-screen"></div>

                    {children}
                </main>
            </div>
        </div>
    );
}
