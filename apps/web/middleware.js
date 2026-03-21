import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protected routes
  const protectedPaths = ["/organizer", "/participant", "/select-role"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in and visiting /login, redirect to select-role (or dashboard)
  if (pathname === "/login" && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role === "organizer") {
      return NextResponse.redirect(new URL("/organizer/dashboard", req.url));
    } else if (role === "participant") {
      return NextResponse.redirect(new URL("/participant/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/select-role", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/organizer/:path*", "/participant/:path*", "/select-role", "/login"],
};
