"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    // router used for navigation after auth; supabase client for auth calls
    const router = useRouter();
    const supabase = createClient();

    // basic form fields for signup/signin
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // state control for mode, error display, and loading
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // block duplicate submissions

    // handle form submit: sign-in or sign-up, then fetch profile and redirect
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === "sign-in") {
                // 1. Authenticate user session
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
            } else {
                // 2. Register user account
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName.trim() },
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (signUpError) throw signUpError;

                // If email confirmation is enabled, no session/user exists yet
                if (!signUpData.session) {
                    alert("Registration successful! Please check your email to verify your account.");
                    setIsLoading(false);
                    return;
                }
            }

            // 3. Securely fetch the active user data 
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("Could not retrieve authenticated profile data.");

            // 4. Query user database record to evaluate layout permission privileges
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            // 5. Navigate to routing target based on metadata assignment
            router.push(profile?.role === "board_admin" ? "/board/dashboard" : "/resident/dashboard");
            router.refresh();

        } catch (err: any) {
            setError(err.message || "An unexpected validation exception occurred.");
            setIsLoading(false);
        }
    }

    // switch between sign-in and sign-up form modes
    function handleModeSwitch() {
        setError(null);
        setMode(prev => prev === "sign-in" ? "sign-up" : "sign-in");
    }

    // render login / signup UI
    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-md transition-all">
                
                {/* Header view area */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {mode === "sign-in" ? "Sign in" : "Create an account"}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {mode === "sign-in" ? "Access your resident tracking dashboard ledger" : "Sign up below to join your association community"}
                    </p>
                </div>

                <div className="space-y-3">
                    {/* Full Name Block: Visible only during signup workflows */}
                    {mode === "sign-up" && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Full Name</label>
                            <input 
                                required 
                                type="text"
                                placeholder="Juan dela Cruz" 
                                value={fullName}
                                disabled={isLoading}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50" 
                            />
                        </div>
                    )}

                    {/* Email Input Field */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Email Address</label>
                        <input 
                            required 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email}
                            disabled={isLoading}
                            onChange={(e) => setEmail(e.target.value)} 
                            className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50" 
                        />
                    </div>

                    {/* Password Input Field */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Password</label>
                        <input 
                            required 
                            type="password" 
                            minLength={8} 
                            placeholder="••••••••" 
                            value={password}
                            disabled={isLoading}
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50" 
                        />
                    </div>
                </div>

                {/* Inline Error Logs Alerts Banner */}
                {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-lg">
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
                    </div>
                )}

                {/* Execution controls wrapper button setup */}
                <div className="space-y-2 pt-1">
                    <button 
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 text-white font-medium rounded-lg py-2 text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? "Processing validation..." : mode === "sign-in" ? "Sign in" : "Sign up"}
                    </button>
                    
                    <button 
                        type="button" 
                        disabled={isLoading}
                        onClick={handleModeSwitch}
                        className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition py-1"
                    >
                        {mode === "sign-in" ? "Need an account? Create one here" : "Already have a linked account? Sign in"}
                    </button>
                </div>
            </form>
        </main>
    );
}
