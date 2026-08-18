import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AuthPayload {
  id: string;
  email: string;
  role: "CLIENT" | "CB" | "ADMIN" | string;
  name?: string;
  [key: string]: unknown;
}

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set in environment variables.");
    }
    // Fallback secret for local development
    return new TextEncoder().encode("dev-fallback-secret-key-replace-in-production-12345");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Extract raw token string from Request headers (Authorization: Bearer) or cookies (auth_token).
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get verified user payload from Request or cookies.
 */
export async function getAuthUser(req?: Request): Promise<AuthPayload> {
  let token: string | null = null;

  if (req) {
    token = extractToken(req);
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value ?? cookieStore.get("token")?.value ?? null;
    } catch {
      // Cookies() may not be available outside server actions/route handlers
    }
  }

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);

    if (!payload?.id) {
      throw new Error("Invalid token payload: Missing ID");
    }

    return payload as unknown as AuthPayload;
  } catch (err: any) {
    if (err.name === "JWTExpired" || err.code === "ERR_JWT_EXPIRED") {
      throw new Error("Unauthorized: Token expired");
    }
    throw new Error("Unauthorized: Invalid token");
  }
}

/**
 * Backward-compatible helper to get user ID from request.
 */
export async function getUserIdFromToken(req: Request): Promise<string> {
  const user = await getAuthUser(req);
  return user.id;
}

/**
 * Guard that enforces required roles.
 */
export async function requireRole(
  req: Request,
  allowedRoles: Array<"CLIENT" | "CB" | "ADMIN" | string>
): Promise<AuthPayload> {
  const user = await getAuthUser(req);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role ${user.role} does not have access`);
  }
  return user;
}