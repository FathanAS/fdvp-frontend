"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, UserCircle, LogOut, Settings, LayoutDashboard, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Monitor Scroll for Glass Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent Body Scroll when Mobile Menu is Open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navLinks = ["home", "about", "event", "shop", "chat"].filter(key => {
    if (!user) return ["home", "about"].includes(key);
    return true;
  });

  const isAdminRole = ['admin', 'superadmin', 'staff', 'owner', 'administrator'].includes(role || '');

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-[5000] transition-all duration-300 border-b ${scrolled
          ? "bg-fdvp-bg/95 backdrop-blur-md border-fdvp-text/5 py-3 shadow-md"
          : "bg-transparent border-transparent py-5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">

          {/* 1. LEFT SECTION: Back Button & Logo */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Back Button (Visible if not Home) */}
            {pathname !== "/" && (
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-fdvp-text/10 text-fdvp-text-light transition-colors relative z-[5001]"
                aria-label="Go Back"
              >
                <ArrowLeft size={24} />
              </button>
            )}

            {/* LOGO */}
            <Link href="/" className="relative z-[5001] group block">
              {/* Light Mode Logo */}
              <img
                src="/images/logo-fdvp-black.png"
                alt="FDVP"
                className="h-8 md:h-10 w-auto object-contain dark:hidden"
              />
              {/* Dark Mode Logo */}
              <img
                src="/images/logo-fdvp-white.png"
                alt="FDVP"
                className="h-8 md:h-10 w-auto object-contain hidden dark:block"
              />
            </Link>
          </div>

          {/* 2. DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-1 bg-fdvp-text/5 p-1 rounded-full border border-fdvp-text/5 backdrop-blur-sm">
            {navLinks.map((key) => {
              const label = t.navbar[key as keyof typeof t.navbar];
              return (
                <Link
                  key={key}
                  href={key === "home" ? "/" : `/${key}`}
                  className="px-5 py-2 text-sm font-medium rounded-full text-fdvp-text-light/80 hover:text-fdvp-text-light hover:bg-fdvp-bg shadow-sm transition-all duration-200"
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* 3. DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Dashboard Button */}
                {isAdminRole && (
                  <Link
                    href="/dashboard"
                    title="Dashboard"
                    className="p-2.5 text-fdvp-text hover:text-fdvp-primary hover:bg-fdvp-primary/10 rounded-full transition-colors"
                  >
                    <LayoutDashboard size={20} />
                  </Link>
                )}

                {/* Profile Dropdown Logic (Simple Hover Group) */}
                <div className="relative group">
                  <button className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-fdvp-card border border-fdvp-text/10 hover:border-fdvp-primary/30 transition-all shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-fdvp-text/10 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-fdvp-primary text-white text-xs font-bold">
                          {user.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.displayName?.split(" ")[0]}</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-2 w-56 hidden group-hover:block opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-fdvp-card border border-fdvp-text/10 rounded-2xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                      <div className="px-3 py-2 border-b border-fdvp-text/5 mb-1">
                        <p className="text-[10px] uppercase tracking-wider opacity-60">Signed in as</p>
                        <p className="font-bold text-sm truncate">{user.email}</p>
                      </div>

                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-fdvp-text/5 transition-colors">
                        <UserCircle size={16} /> {t.navbar.myProfile}
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-fdvp-text/5 transition-colors">
                        <Settings size={16} /> {t.navbar.settings}
                      </Link>

                      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors w-full text-left">
                        <LogOut size={16} /> {t.navbar.logout}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-bold text-fdvp-text-light hover:text-fdvp-primary transition-colors">
                  {t.navbar.login}
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-fdvp-primary text-white text-sm font-bold rounded-full hover:bg-fdvp-accent shadow-lg shadow-fdvp-primary/20 hover:shadow-fdvp-primary/40 transition-all hover:-translate-y-0.5"
                >
                  {t.navbar.joinNow}
                </Link>
              </div>
            )}
          </div>

          {/* 4. MOBILE TOGGLE */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative z-[5001] p-2.5 bg-fdvp-text/5 hover:bg-fdvp-text/10 rounded-full transition-colors text-fdvp-text-light"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* 5. MOBILE MENU OVERLAY */}
      <div
        className={`fixed inset-0 z-[9999] bg-fdvp-bg/98 backdrop-blur-3xl flex flex-col items-center pt-16 px-6 gap-6 transition-all duration-300 md:hidden overflow-y-auto ${isOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-full opacity-0 invisible"}`}
      >

        {/* OVERLAY HEADER (Close Button) */}
        <div className="w-full flex justify-between items-center pb-4 border-b border-fdvp-text/5">
          <span className="text-xl font-bold text-fdvp-text-light">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-fdvp-text/5 rounded-full text-fdvp-text-light hover:bg-fdvp-text/10"
          >
            <X size={24} />
          </button>
        </div>

        {/* DECORATION */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-fdvp-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fdvp-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="flex flex-col gap-2 w-full mt-2 text-center">

          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-2">
            {navLinks.map((key) => {
              const label = t.navbar[key as keyof typeof t.navbar];
              return (
                <Link
                  key={key}
                  href={key === "home" ? "/" : `/${key}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between text-2xl font-bold text-fdvp-text-light py-3 border-b border-fdvp-text/5"
                >
                  {label}
                  <ChevronRight size={20} className="opacity-30" />
                </Link>
              )
            })}
          </div>

          {/* Mobile Auth Section */}
          <div>
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-fdvp-text/5 border border-fdvp-text/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-fdvp-primary/20 flex items-center justify-center text-fdvp-primary font-bold text-xl overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      user.displayName?.charAt(0) || "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg truncate text-fdvp-text-light">{user.displayName}</h4>
                    <p className="text-xs uppercase tracking-wider opacity-60 bg-fdvp-primary/10 text-fdvp-primary inline-block px-2 py-0.5 rounded-md mt-1">
                      {role || "Member"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {isAdminRole && (
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-fdvp-card border border-fdvp-text/10 hover:border-fdvp-primary/50 transition-all">
                      <LayoutDashboard className="text-fdvp-primary" />
                      <span className="text-xs font-bold">Dashboard</span>
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-fdvp-card border border-fdvp-text/10 hover:border-fdvp-primary/50 transition-all">
                    <UserCircle className="text-fdvp-text-light" />
                    <span className="text-xs font-bold text-fdvp-text-light">Profile</span>
                  </Link>
                  <Link href="/settings" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-fdvp-card border border-fdvp-text/10 hover:border-fdvp-primary/50 transition-all">
                    <Settings className="text-fdvp-text-light" />
                    <span className="text-xs font-bold text-fdvp-text-light">Settings</span>
                  </Link>
                  <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-red-500">
                    <LogOut />
                    <span className="text-xs font-bold">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 rounded-xl text-center font-bold border border-fdvp-text/20 hover:bg-fdvp-text/5 transition-colors"
                >
                  {t.navbar.login}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 rounded-xl text-center font-bold bg-fdvp-primary text-white shadow-lg shadow-fdvp-primary/20"
                >
                  {t.navbar.joinNow}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}