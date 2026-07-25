import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
    // Create a Supabase client on the server for this request.
    const supabase = await createClient();

    // Get the current logged-in session.
    const { data: { session } } = await supabase.auth.getSession();

    // If no user is logged in, return null.
    if (!session) return null;

    // Query the user's profile from the profiles table.
    const { data } = await supabase.from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    return data;
}