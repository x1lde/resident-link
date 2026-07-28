import { createClient } from "@/lib/supabase/server";
import { createUnit, assignUnit } from "@/lib/actions/homeowners";
import { formatUnit } from "@/lib/format";

export default async function HomeownersPage() {
    // Start a Supabase client for this page.
    const supabase = await createClient();

    // Load all units and the homeowner linked to each unit.
    const { data: units } = await supabase
    .from("units")
    .select("*, profiles(id, full_name, email)")
    .order("unit_numver");

    // Load users who signed up but have not yet been assigned a unit.
    const { data: unassigned } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .is("unit_id", null);

    return(
        <div className="p-8 space-y-8 max-w-21">
            <h1 className="text-2x1 font-semibold">Homeowners</h1>

            <div className="space-y-2">
                <h2 className="font-medium">Units</h2>
                <table className="w-full text-sm border rounded">
                    <thead className="bg-slate-50 text-left">
                        <tr>
                            <th className="px-3 py-2">Unit</th>
                            <th className="px-3 py-2">Address</th>
                            <th className="px-3 py-2">Owner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units?.map((u) => {
                            const owner = (u as any).profiles?.[0];
                            return (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2 font-mono">{u.unit_number}</td>
                                    <td className="px-3 py-2">{u.address_line ?? "—"}</td>
                                    <td>{owner ? `${owner.full_name} (${owner.email})` : "Unassigned"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <form action={createUnit} className="border rounded p-4 space-y-3">
                <h2 className="font-medium">Add a unit</h2>
                <div className="grid grid-cols-2 gap-3">
                    <input name="block" required placeholder="Block (e.g. 20)" className="w-full border rounded px-3 py-2" />
                    <input name="lot" required placeholder="Lot (e.g. 55)" className="w-full border rounded px-3 py-2" />
                </div>
                <input name="address_line" placeholder="Street / additional address (optional)"/>
                <button className="bg-slate-800 text-white rounded px-4 py-2">Add unit</button>
            </form>

            { unassigned && unassigned.length > 0 && (
                <div className="space-y-2">
                    <h2 className="font-medium">Link a signed-up homeowner to a unit</h2>
                    {unassigned.map((p) => (
                        <form key={p.id} action={assignUnit} className="border rounded p-3 flex items-center gap-3">
                            <input type="hidden" name="profile_id" value={p.id} />
                            <span className="flex-1 text-sm">{p.full_name} ({p.email})</span>
                            <select name="unit_id" required className="border rounded px-2 py-1 text-sm">
                                <option value="">Select unit</option>
                                {units?.map((u) => <option key={u.id} value={u.id}>{formatUnit(u)}</option>)}
                            </select>
                        </form>
                    ))}
                </div>
            )}
        </div>
    );
}