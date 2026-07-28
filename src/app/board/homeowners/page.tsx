import { createClient } from "@/lib/supabase/server";
import { createUnit, assignUnit } from "@/lib/actions/homeowners";
import { formatUnit } from "@/lib/format";

// Board homeowners management page.
export default async function HomeownersPage() {
    // initialise the Supabase server client
    const supabase = await createClient();

    // load all units and any linked profile assignment
    const { data: units } = await supabase
        .from("units")
        .select("id, unit_number, address_line, block, lot, profiles(id, full_name, email)")
        .order("block", { ascending: true })
        .order("lot", { ascending: true });

    // load any signed-up profiles that still need a unit assigned
    const { data: unassigned } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .is("unit_id", null);

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
            {/* page header */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Homeowners</h1>

            {/* Units Ledger Table Section Layout View Wrapper */}
            <div className="space-y-3">
                <h2 className="font-semibold text-slate-700 dark:text-zinc-300">Units Registry</h2>
                <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 font-medium">
                            <tr>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Assigned Owner</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                            {units && units.length > 0 ? (
                                units.map((u) => {
                                    // Handle both array mapping or singular object relationship response wrappers cleanly
                                    const owner = Array.isArray(u.profiles) ? u.profiles[0] : (u.profiles as any);
                                    
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-4 py-3.5 font-mono font-medium text-slate-700 dark:text-zinc-200">
                                                {u.unit_number || `B${u.block} L${u.lot}`}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400">
                                                {u.address_line ?? "—"}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm">
                                                {owner ? (
                                                    <span className="text-slate-800 dark:text-zinc-200 font-medium">
                                                        {owner.full_name} <span className="text-xs text-slate-400 font-normal">({owner.email})</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded text-xs">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                        No structural property units recorded in the database registry system yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* form for creating a new unit */}
            <form action={createUnit} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 bg-white dark:bg-zinc-900/40 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-zinc-200">Add a New Unit</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Block Identification</label>
                        <input name="block" required placeholder="e.g. 20" className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Lot Identification</label>
                        <input name="lot" required placeholder="e.g. 55" className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Physical Street Address (Optional)</label>
                    <input name="address_line" placeholder="Street name / phase designation details..." className="w-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 text-white font-medium rounded-lg px-5 py-2 text-sm transition shadow-sm w-full sm:w-auto">
                    Add Unit Entry
                </button>
            </form>

            {/* section for linking unassigned homeowners to units */}
            {unassigned && unassigned.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-semibold text-slate-800 dark:text-zinc-200">Link a Signed-up Homeowner to a Unit</h2>
                    <div className="space-y-2">
                        {unassigned.map((p) => (
                            <form key={p.id} action={assignUnit} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                <input type="hidden" name="profile_id" value={p.id} />
                                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">
                                    {p.full_name} <span className="text-xs text-slate-400 font-normal">({p.email})</span>
                                </span>
                                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                    <select name="unit_id" required className="flex-1 sm:flex-none border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select Target Unit...</option>
                                        {units?.map((u) => (
                                            <option key={u.id} value={u.id}>{formatUnit(u)}</option>
                                        ))}
                                    </select>
                                    <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition shadow-sm">
                                        Link
                                    </button>
                                </div>
                            </form>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
