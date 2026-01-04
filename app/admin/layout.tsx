"use client";
import AdminGuard from "@/components/AdminGuards";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CalendarPlus, Users, LogOut, ScanLine } from "lucide-react";

import { auth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Manage Events", href: "/admin/events", icon: <Calendar size={20} /> },
    { name: "Scan Ticket", href: "/admin/scan", icon: <ScanLine size={20} /> },
    // { name: "Manage Users", href: "/admin/users", icon: <Users size={20} /> }, // Hidden until implemented
  ];

  return (
    <AdminGuard>
      <Navbar />
      <div className="flex min-h-screen bg-fdvp-bg pt-20">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white dark:bg-[#1E1E1E] border-r border-fdvp-text/10 hidden md:flex flex-col fixed top-20 bottom-0 z-40 transition-colors duration-300 shadow-lg">
          <div className="p-6 border-b border-fdvp-text/10">
            <h1 className="text-xl font-bold text-fdvp-text-light">ADMIN <span className="text-fdvp-accent">PANEL</span></h1>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? "bg-fdvp-primary text-white shadow-lg shadow-fdvp-primary/20"
                    : "text-fdvp-text hover:bg-fdvp-bg hover:text-fdvp-text-light"
                    }`}>
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-fdvp-text/10">
            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}