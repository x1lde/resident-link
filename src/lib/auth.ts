import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
    // Start a Supabase client on the server side.
    const supabase = await createClient();

    // Ask Supabase who is currently logged in.
    const { data: { session } } = await supabase.auth.getSession();

    // If nobody is logged in, there is no profile to return.
    if (!session) return null;

    // Query the user's profile from the profiles table.
    const { data } = await supabase.from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    return data;
}

export async function requireBoardAdmin() {
    // Get the current user's profile.
    const profile = await getCurrentProfile();

    // Only allow users with the board_admin role.
    if (!profile || profile.role !== "board_admin") {
        throw new Error("Board access required");
    }
    return profile;
}