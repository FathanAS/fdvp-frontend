"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, ShieldCheck, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification States
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const router = useRouter();
  const { notify } = useNotification();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check if email needs verification (NOT ending in fdvp.com)
      if (!email.toLowerCase().endsWith("@fdvp.com")) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";

        // Trigger Backend Verification flow
        const res = await fetch(`${backendUrl}/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to send verification code. Ensure Backend is running on port 3001.");
        }

        setStep("verify");
        setLoading(false);
        return; // Stop here, wait for code
      }

      // If fdvp.com, proceed to register immediately
      await performRegistration();
    } catch (err: any) {
      notify("Registration Failed", err.message, "error");
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid code");
      }

      // Code verified, now create account
      await performRegistration();

    } catch (err: any) {
      setVerificationError(err.message);
      setLoading(false);
    }
  };

  const performRegistration = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });
      await sendEmailVerification(user); // Still send Firebase link for completeness

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        role: "member",
        createdAt: new Date(),
        username: email.split("@")[0].toLowerCase(),
        photoURL: null,
        onboardingCompleted: false
      });

      notify("Registration Success", "Account created successfully!", "success");
      router.push("/login"); // Redirect to login
    } catch (err: any) {
      throw err;
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

      // GUARD: If enforcing domain check on Google Login too, add check here.
      // But usually Google Login verifies ownership implicitly. 
      // User request only mentioned "email addresses", implying manual entry.
      // We will allow Google Login as is for now, or users can restrict it if needed.

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "member",
          createdAt: new Date(),
          username: user.email?.split("@")[0].toLowerCase() || "user",
          onboardingCompleted: false // Flag for redirection
        });
        router.push("/onboarding"); // New user -> Onboarding
      } else {
        // Check if existing user completed onboarding
        if (userDocSnap.data().onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }

    } catch (err: any) {
      console.error("Google Login Error", err);
      notify("Google Login failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-fdvp-bg font-sans selection:bg-fdvp-primary/30 text-fdvp-text-light">

      {/* LEFT PANEL - VISUAL (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden h-full">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center transition-transform duration-1000 hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-fdvp-accent/10 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end pb-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fdvp-accent to-fdvp-primary flex items-center justify-center mb-8 shadow-2xl shadow-fdvp-primary/30">
            <Loader2 size={32} className="text-white animate-spin-slow" />
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Join the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fdvp-accent to-fdvp-primary">Revolution</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
            Create your account today and start your journey with the most vibrant developer community.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 relative bg-fdvp-bg">

        <div className="w-full max-w-md space-y-8">

          {step === "verify" ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <button
                onClick={() => setStep("register")}
                className="flex items-center text-sm text-fdvp-text/60 hover:text-fdvp-primary mb-8 gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Back to details
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-fdvp-primary/10 flex items-center justify-center mx-auto mb-4 border border-fdvp-primary/20">
                  <ShieldCheck size={32} className="text-fdvp-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Verify Email</h1>
                <p className="text-fdvp-text/60">
                  We sent a 6-digit code to <span className="font-bold text-fdvp-text-light">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-center text-2xl tracking-[0.5em] font-bold text-fdvp-text-light placeholder:text-fdvp-text/10 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all"
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </div>

                {verificationError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm">
                    <AlertCircle size={18} /> {verificationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-fdvp-primary hover:bg-fdvp-accent text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-fdvp-primary/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Verify & Create Account"}
                </button>

                <p className="text-center text-xs text-fdvp-text/40">
                  Didn't receive code? <button type="button" onClick={handleRegister} className="text-fdvp-primary hover:underline">Resend</button>
                </p>
              </form>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Create Account</h1>
                <p className="text-fdvp-text/60">It only takes a minute to get started.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={displayName}
                    className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg"
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="member@fdvp.com"
                    value={email}
                    className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all text-lg"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
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
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Get Started"}
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-fdvp-text/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-fdvp-bg px-4 text-fdvp-text/40 font-bold tracking-widest">Or Register With</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                  Sign up with Google
                </button>
              </form>

              <div className="text-center pt-4">
                <p className="text-fdvp-text/60">
                  Already have an account?{" "}
                  <Link href="/login" className="text-fdvp-primary font-bold hover:text-fdvp-accent transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}