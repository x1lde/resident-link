import { createClient } from "@/lib/supabase/server";
import { createDuesCharges, recordDuesPayment } from "@/lib/actions/dues";
import { formatUnit } from "@/lib/format";

export default async function BoardDuesPage() {
    // Start a Supabase client for this page.
    const supabase = await createClient();

    // Load the list of units to choose from when creating a charge.
    const { data: units } = await supabase.from("units").select("id, block, lot").order("block").order("lot");
    // Load all dues charges and the unit details for each charge.
    const { data: charges } = await supabase
    .from("dues_charges")
    .select("*, units(block, lot)")
    .order("due_date", { ascending: false });

    return (
    <div className="p-8 space-y-8 max-w-2xl">
        <h1 className="text-2xl font-semibold">Dues</h1>

        <form action={createDuesCharges} className="border rounded p-4 space-y-3">
        <h2 className="font-medium">New charge</h2>
        <select name="unit_id" required className="w-full border rounded px-3 py-2">
            <option value="">Select a unit</option>
            {units?.map((u) => (
            <option key={u.id} value={u.id}>{formatUnit(u)}</option>
            ))}
        </select>
        <input name="description" required placeholder="Description (e.g. October dues)"
            className="w-full border rounded px-3 py-2" />
        <input name="amount" type="number" step="0.01" required placeholder="Amount"
            className="w-full border rounded px-3 py-2" />
        <input name="due_date" type="date" required className="w-full border rounded px-3 py-2" />
        <button className="bg-slate-800 text-white rounded px-4 py-2">Create charge</button>
        </form>

        <div className="space-y-2">
        {charges?.map((c) => (
            <div key={c.id} className="border rounded p-3 flex items-center justify-between">
            <div>
                <p className="font-medium">{formatUnit((c as any).units)} — {c.description}</p>
                <p className="text-xs text-slate-500">Due {c.due_date} · ${c.amount}</p>
            </div>
            {c.status === "pending" || c.status === "overdue" ? (
                <form action={recordDuesPayment} className="flex items-center gap-2">
                <input type="hidden" name="charge_id" value={c.id} />
                <input type="hidden" name="amount" value={c.amount} />
                <input type="hidden" name="method" value="manual" />
                <button className="text-sm border rounded px-3 py-1">Mark paid</button>
                </form>
            ) : (
                <span className="text-sm text-green-700 font-medium">{c.status}</span>
            )}
            </div>
        ))}
        </div>
    </div>
    );
}