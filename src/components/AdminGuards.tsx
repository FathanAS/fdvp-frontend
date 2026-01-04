"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login"); // Belum login? Ke login
      } else if (role !== "admin") {
        router.push("/"); // Bukan admin? Balik ke home
        alert("Akses Ditolak: Halaman ini khusus Admin.");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-fdvp-bg">
        <Loader2 className="animate-spin text-fdvp-accent" size={48} />
      </div>
    );
  }

  // Jika lolos seleksi, tampilkan halaman admin
  return user && role === "admin" ? <>{children}</> : null;
}