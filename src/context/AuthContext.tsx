"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  role: "user" | "staff" | "admin" | "superadmin" | "owner" | "administrator" | "manager" | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "staff" | "admin" | "superadmin" | "owner" | "administrator" | "manager" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);

          // CEK DATABASE: Ambil data role
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Self-healing: Update photoURL if missing in DB but exists in Auth
            if (!userData.photoURL && currentUser.photoURL) {
              // We import updateDoc to support this, assuming it's imported or I should review imports
              const { updateDoc } = await import("firebase/firestore");
              await updateDoc(userRef, { photoURL: currentUser.photoURL });
            }

            // Jika data ada, ambil role-nya, casting ke tipe yang benar
            const userRole = userData.role as "user" | "staff" | "admin" | "superadmin" | "owner" | "administrator" | "manager";
            setRole(userRole);
          } else {
            // ... default creation ...
            await setDoc(userRef, {
              email: currentUser.email,
              role: "user",
              createdAt: new Date(),
              username: currentUser.email?.split("@")[0] || "User",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || ""
            });
            setRole("user");
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Auth Context Error:", error);
        // Tetap set user null jika error agar tidak loading selamanya
        setUser(null);
      } finally {
        // PENTING: Matikan loading apapun yang terjadi
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {/* Tampilkan loading screen sederhana saat inisialisasi agar tidak blank */}
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-[#1E1E1E] text-white">
          Loading FDVP System...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);