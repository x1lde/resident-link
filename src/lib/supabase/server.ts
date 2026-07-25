import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    // Obtain the current request's cookie store from Next.js server-side headers.
    const cookieStore = await cookies();

    // Create and return a Supabase client configured for SSR.
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                // Return all cookies from the current request/response context.
                getAll() {
                    return cookieStore.getAll();
                },
                // Apply cookies from Supabase to the Next.js cookie store.
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // Ignore cookie-setting failures to avoid crashing SSR.
                    }
                }
            }
        }
    );
}
