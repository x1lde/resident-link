import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format"; // Import your Philippine Peso formatter utility

export default async function ResidentDuesPage() {
    // load the signed-in resident profile
    const profile = await getCurrentProfile();
    const supabase = await createClient();

    // load dues charges only when the profile is linked to a unit
    const { data: charges } = profile?.unit_id
        ? await supabase
            .from("dues_charges")
            .select("id, description, amount, due_date, status") // only fetch needed fields
            .eq("unit_id", profile.unit_id)
            .order("due_date", { ascending: false })
        : { data: null };

    // calculate the current unpaid balance for open charges
    const balance = charges
        ?.filter((c) => c.status !== "paid")
        .reduce((sum, charge) => sum + charge.amount, 0) ?? 0;

    return (
        <div className="p-8 space-y-8 max-w-2xl mx-auto w-full">
            {/* Header section area */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My dues</h1>
                {!profile?.unit_id && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                        Your account isn't linked to a unit yet — ask the board to assign your unit.
                    </p>
                )}
            </div>

            {/* Main Balance Overview Display Card */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-6 bg-slate-50 dark:bg-zinc-900/50 shadow-sm max-w-sm">
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Total Balance due
                </p>
                {/* Optimized Currency injection layout */}
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatCurrency(balance)}
                </p>
            </div>

            {/* statement history list container */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Statement History</h2>
                
                {charges && charges.length > 0 ? (
                    charges.map((c) => {
                        const isPaid = c.status === "paid";
                        const isPartial = c.status === "partially_paid";
                        
                        return (
                            <div key={c.id} className="border border-slate-100 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 shadow-sm">
                                <div className="space-y-1 min-w-0">
                                    <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">{c.description}</p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">Due on {c.due_date}</p>
                                </div>
                                
                                {/* status badge and amount display */}
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {formatCurrency(c.amount)}
                                    </span>
                                    <span className={`text-xs font-medium uppercase tracking-wider mt-0.5 ${
                                        isPaid ? "text-emerald-600 dark:text-emerald-400" : 
                                        isPartial ? "text-amber-600 dark:text-amber-400" : 
                                        "text-rose-600 dark:text-rose-400"
                                    }`}>
                                        {c.status?.replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-slate-500 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-900/30 border border-dashed rounded-lg p-6 text-center">
                        No charges or billing statements recorded yet.
                    </p>
                )}
            </div>
        </div>
    );
}
