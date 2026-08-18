import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-fallback-secret-key-replace-in-production-12345";
  return new TextEncoder().encode(secret);
}

const roleAccessMap: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  CB: "/dashboard/team",
  CLIENT: "/dashboard/client",
};

// Protected API routes and their required roles
const apiAccessMap: Record<string, string[]> = {
  "/api/inventory": ["ADMIN", "CB", "CLIENT"],
  "/api/users": ["ADMIN"],
  "/api/orders": ["ADMIN", "CB", "CLIENT"],
  "/api/admin": ["ADMIN"],
};

function isOriginAllowed(origin: string | null, req: NextRequest): boolean {
  if (!origin) return true; // Same-origin or non-browser request

  const currentOrigin = req.nextUrl.origin;
  if (origin === currentOrigin) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const customOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const allowedList = [siteUrl, appUrl, ...customOrigins].filter(Boolean);

  // In development, allow localhost/127.0.0.1 on any port
  if (process.env.NODE_ENV !== "production") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  if (allowedList.length === 0) {
    return true; // If no allowed origins explicitly set, default to permissive for host domain
  }

  return allowedList.includes(origin);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value || request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const JWT_SECRET = getSecret();

  // ==========================================
  // 🔐 API ROUTES SECURITY
  // ==========================================
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    // 🛑 CORS Protection
    if (!isOriginAllowed(origin, request)) {
      return NextResponse.json(
        { success: false, message: "CORS Error: Access Denied" },
        { status: 403 }
      );
    }

    // Dynamic API Protection Check
    const protectedRoute = Object.keys(apiAccessMap).find((route) =>
      pathname.startsWith(route)
    );

    if (protectedRoute) {
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Token missing" },
          { status: 401 }
        );
      }

      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        const allowedRoles = apiAccessMap[protectedRoute];

        if (!allowedRoles.includes(role)) {
          return NextResponse.json(
            { success: false, message: `Forbidden: Insufficient permissions for role ${role}` },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Invalid or expired token" },
          { status: 401 }
        );
      }
    }

    return NextResponse.next();
  }

  // ==========================================
  // FRONTEND PAGES PROTECTION (DASHBOARD, AUTH, ETC.)
  // ==========================================
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth/login");
  const isVerifyRoute = pathname.startsWith("/verify-otp");

  if (isDashboardRoute) {
    if (!token) return NextResponse.redirect(new URL("/auth/login", request.url));
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;
      const allowedRoute = roleAccessMap[role];
      if (!allowedRoute || !pathname.startsWith(allowedRoute)) {
        return NextResponse.redirect(new URL(allowedRoute || "/auth/login", request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  if (isVerifyRoute && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(
        new URL(roleAccessMap[payload.role as string] || "/dashboard/client", request.url)
      );
    } catch {
      return NextResponse.next();
    }
  }

  if (token && isAuthRoute) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(
        new URL(roleAccessMap[payload.role as string] || "/dashboard/client", request.url)
      );
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup",
    "/verify-otp",
  ],
};