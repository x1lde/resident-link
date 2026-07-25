import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    // Create a Supabase client for use in the browser.
    // These values are exposed in client-side code and should be public keys.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!
    );
}