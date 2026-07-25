import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
    // Create a Supabase client that can read cookies and set response cookies.
    const { supabase, response } = createMiddlewareClient(request);

    // Check whether the user is logged in for this request.
    const { data: { session } } = await supabase.auth.getSession();

    // Figure out which path the user is trying to visit.
    const path = request.nextUrl.pathname;
    const isProtected = path.startsWith("/resident") || path.startsWith("/board");

    // If the page is protected and the user has no session, send them to login.
    if (isProtected && !session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If the user is trying to visit board pages, check their role.
    if (session && path.startsWith("/board")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        // Only board admins are allowed to stay on /board pages.
        if (profile?.role !== "board_admin") {
            return NextResponse.redirect(new URL("/resident/dashboard", request.url));
        }
    }

    // Return the response (with any cookies Supabase set).
    return response;
}

export const config = { matcher: ["/resident/:path*", "/board/:path*"] };