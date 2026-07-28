import { createClient } from "@/lib/supabase/server";
import { createDuesCharges, recordDuesPayment } from "@/lib/actions/dues";
import { formatUnit, formatCurrency } from "@/lib/format"; // Import helper formatter utilities

// Board dues management page for administrators.
export default async function BoardDuesPage() {
    // create the server-side Supabase client
    const supabase = await createClient();

    // load all units to populate the charge creation dropdown
    const { data: units } = await supabase
        .from("units")
        .select("id, block, lot")
        .order("block")
        .order("lot");

    // load all dues charges and their linked unit data
    const { data: charges } = await supabase
        .from("dues_charges")
        .select("id, description, amount, due_date, status, unit_id, units(block, lot)")
        .order("due_date", { ascending: false });

    return (
        // dashboard container wrapper
        <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
            
            {/* Page Header Header Banner */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Association Billing Ledger</h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Issue new community service charges or log manual cash collections.</p>
            </div>

            {/* form for creating a new dues charge */}
            <form action={createDuesCharges} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 bg-white dark:bg-zinc-900/40 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-zinc-200">Issue New Billing Charge</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Target Property Unit</label>
                        <select name="unit_id" required className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select a unit location...</option>
                            {units?.map((u) => (
                                <option key={u.id} value={u.id}>{formatUnit(u)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Billing Statement Description</label>
                        <input name="description" required placeholder="e.g. October Association Dues" className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Assessment Amount</label>
                        <input name="amount" type="number" step="0.01" required placeholder="₱ 0.00" className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Payment Deadline Due Date</label>
                        <input name="due_date" type="date" required className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <button className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 text-white font-medium rounded-lg px-5 py-2 text-sm transition shadow-sm w-full sm:w-auto">
                    Create Invoice Charge
                </button>
            </form>

            {/* list of active dues charges and payment actions */}
            <div className="space-y-3">
                <h2 className="font-semibold text-slate-700 dark:text-zinc-300">Active Invoices Log Registry</h2>
                
                <div className="space-y-2">
                    {charges && charges.length > 0 ? (
                        charges.map((c) => {
                            // extract related unit details from joined query data
                            const unitData = (c as any).units;
                            const isPaid = c.status === "paid";
                            
                            return (
                                <div key={c.id} className="border border-slate-100 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 shadow-sm transition-colors hover:bg-slate-50/40 dark:hover:bg-zinc-800/10">
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                            {unitData ? formatUnit(unitData) : "Unknown Unit"} — <span className="font-normal text-slate-600 dark:text-zinc-400">{c.description}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                                            Deadline: <span className="font-medium text-slate-600 dark:text-zinc-400">{c.due_date}</span> · Base Billing Total: <span className="font-medium text-slate-700 dark:text-zinc-300">{formatCurrency(c.amount)}</span>
                                        </p>
                                    </div>
                                    
                                    {/* payment action or paid status badge */}
                                    <div className="shrink-0 flex items-center justify-end">
                                        {!isPaid ? (
                                            /* FIX: Allows forms to keep collecting payments for pending OR partially_paid invoices */
                                            <form action={recordDuesPayment} className="flex items-center gap-2 w-full sm:w-auto">
                                                <input type="hidden" name="charge_id" value={c.id} />
                                                <input type="hidden" name="amount" value={c.amount} />
                                                <input type="hidden" name="method" value="manual" />
                                                
                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-lg p-1">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                                                        c.status === "partially_paid" 
                                                            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" 
                                                            : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                                                    }`}>
                                                        {c.status?.replace("_", " ")}
                                                    </span>
                                                    <button className="text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border text-slate-800 dark:text-zinc-200 px-3 py-1 rounded-md transition shadow-sm whitespace-nowrap">
                                                        Mark Paid
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 block text-center min-w-[90px]">
                                                {c.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-zinc-500 italic text-center border border-dashed rounded-xl p-8 bg-slate-50/50 dark:bg-zinc-900/10">
                            No active dues charges recorded in the system logs.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}