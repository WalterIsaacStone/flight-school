"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Flight School Scheduler</h1>
            <p className="text-slate-300 mt-1">
              Welcome back, {user?.email ?? "User"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm rounded-md border border-slate-600 hover:bg-slate-800 text-slate-300"
          >
            Sign out
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/calendar"
            className="block bg-slate-800/70 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">📅 Calendar</h2>
            <p className="text-sm text-slate-300">
              View and manage bookings across all lines
            </p>
          </Link>

          <Link
            href="/todo"
            className="block bg-slate-800/70 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">✅ To-Do List</h2>
            <p className="text-sm text-slate-300">
              Track actions and tasks across all bookings
            </p>
          </Link>

          <Link
            href="/settings"
            className="block bg-slate-800/70 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">⚙️ Settings</h2>
            <p className="text-sm text-slate-300">
              Configure course types, billing tags, and student tags
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
