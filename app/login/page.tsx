"use client";

import { useState } from "react";
import { supabase, getSiteUrl } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const siteUrl = getSiteUrl();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/`,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error.message);
      showToast("Google sign-in failed. Please try again.", "error");
      setLoading(false);
    }
    // If successful, browser will redirect
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="bg-slate-800/80 p-8 rounded-2xl shadow-lg flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold">Flight School Scheduler</h1>
        <p className="text-sm text-slate-300 mb-2 text-center">
          Sign in with Google to access the scheduler.
        </p>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}
