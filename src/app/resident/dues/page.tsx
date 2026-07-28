import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function ResidentDuesPage() {
    // Get the logged-in user's profile.
    const profile = await getCurrentProfile();
    // Create a Supabase client for database queries.
    const supabase = await createClient();

    // Load dues charges only if the user is linked to a unit.
    const { data: charges } = profile?.unit_id
        ? await supabase
            .from("dues_charges")
            .select("*")
            .eq("unit_id", profile.unit_id)
            .order("due_date", { ascending: false })
        : { data: null };

    // Calculate the balance for unpaid charges.
    const balance = charges?.filter((c) => c.status !== "paid").reduce((sum, charge) => sum + charge.amount, 0) ?? 0;

    return (
        <div className="p-8 space-y-6 max-w-lg">
            <h1 className="text-2xl font-semibold">My dues</h1>

            {!profile?.unit_id && (
                <p className="text-sm text-slate-500">
                    Your account isn't linked to a unit yet — ask the board.
                </p>
            )}

            <div className="border rounded p-4">
                <p className="text-sm text-slate-500">Balance due</p>
                <p className="text-2xl font-mono">${balance.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
                {charges?.length ? (
                    charges.map((c) => (
                        <div key={c.id} className="border rounded p-3 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{c.description}</p>
                                <p className="text-xs text-slate-500">Due {c.due_date}</p>
                            </div>
                            <span className={`text-sm font-medium ${c.status === "paid" ? "text-green-700" : "text-red-600"}`}>
                                ${c.amount} — {c.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500">No charges yet.</p>
                )}
            </div>
        </div>
    );
}