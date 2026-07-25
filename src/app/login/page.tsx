"use Client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    // Next.js router for redirecting after auth success.
    const router = useRouter();

    // Supabase client used for browser authentication.
    const supabase = createClient();

    // Form state for email, password, and form mode.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        // Call the correct Supabase auth function.
        const { error } = mode === "sign-in"
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) return setError(error.message);

        // Redirect the user once sign-in/up succeeds.
        router.push("/resident/dashboard");
        router.refresh();
    }

    return (
    <main className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 border rounded p-6">
        <h1 className="text-2xl font-semibold">{mode === "sign-in" ? "Sign in" : "Create an account"}</h1>
        <input type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
        <input type="password" required minLength={8} placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full bg-slate-800 text-white rounded py-2">
            {mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="w-full text-sm text-slate-500">
            {mode === "sign-in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
        </form>
    </main>
    );
}