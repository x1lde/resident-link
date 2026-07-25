import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createMiddlewareClient(request: NextRequest) {
    // Create a response object we can modify inside middleware.
    // This lets us add cookies that the browser should receive.
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Create a Supabase client for this middleware request.
    // Tell Supabase how to read and write cookies for this request.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                // Read all cookies from the incoming request.
                getAll() {
                    return request.cookies.getAll();
                },
                // Apply cookies that Supabase wants to set.
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Keep the request cookie store in sync, if possible.
                        request.cookies.set({ name, value, ...options });

                        // Add the cookie to the response so the browser saves it.
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Return the Supabase client and the response object.
    return { supabase, response };
}
