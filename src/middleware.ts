import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { supabase, response } = createMiddlewareClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    const path = request.nextUrl.pathname;
    const isProtected = path.startsWith("/resident") || path.startsWith("/board");

    if (isProtected && !session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && path.startsWith("/board")) {
        const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
        if (profile?.role !== "board_admin") {
            return NextResponse.redirect(new URL("/resident/dashboard", request.url));
        }
    }

    return response;
}

export const config = { matcher: ["/resident/:path*", "/board/:path*"] };