"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // db is needed for Google Sync
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check onboarding status
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && !userDocSnap.data().onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      // Custom error message agar lebih user friendly
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Cek apakah user sudah ada di database
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Jika belum ada, buat profile baru otomatis dari data Google
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "member",
          createdAt: new Date(),
          username: user.email?.split("@")[0].toLowerCase() || "user",
          onboardingCompleted: false
        });
        router.push("/onboarding");
      } else {
        if (userDocSnap.data().onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }

    } catch (err: any) {
      console.error("Google Login Error", err);
      setError("Google Login failed. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-fdvp-bg font-sans selection:bg-fdvp-primary/30 text-fdvp-text-light">

      {/* LEFT PANEL - VISUAL (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden h-full">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center transition-transform duration-1000 hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-fdvp-primary/10 mix-blend-overlay"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fdvp-primary to-fdvp-accent flex items-center justify-center mb-8 shadow-2xl shadow-fdvp-primary/30">
            <ArrowRight size={32} className="text-white -rotate-45" />
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-primary to-fdvp-accent">FDVP Community</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
            Connect, collaborate, and grow with thousands of developers and creators in our ecosystem.
          </p>
        </div>

        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fdvp-primary/30 rounded-full blur-[128px] animate-pulse pointer-events-none"></div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 relative bg-fdvp-bg">
        {/* Mobile Header (Only visible on mobile if needed, but we keep generic layout) */}

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Back to Dashboard</h1>
            <p className="text-fdvp-text/60">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="member@fdvp.com"
                className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs text-fdvp-primary font-bold hover:underline transition-colors animate-in fade-in">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg pr-12"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-fdvp-text/40 hover:text-fdvp-text-light transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fdvp-primary to-fdvp-accent hover:to-fdvp-primary text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-fdvp-primary/20 hover:scale-[1.01] hover:shadow-fdvp-primary/40 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Sign In"}
              {!loading && <ArrowRight size={20} />}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fdvp-text/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-fdvp-bg px-4 text-fdvp-text/40 font-bold tracking-widest">Or Continue With</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-fdvp-text/60">
              Don't have an account?{" "}
              <Link href="/register" className="text-fdvp-primary font-bold hover:text-fdvp-accent transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer / Copyright logic could go here */}
      </div>
    </div>
  );
}