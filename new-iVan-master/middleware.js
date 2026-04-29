import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Exempted API paths (no authentication needed)
const exemptedPaths = [
  "/api/auth",
  "/api/public",
  "/api/openapi",
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/activate",
  "/api/reset-password",
  "/api/public-jobs",
  "/api/subscription/webhook",
  "/api/products/public",
  "/api/shops/public",
  "/api/luggage-items/public",
  "/api/luggage-locations/public",
  "/api/all-categories",
  "/api/health",
  "/api/business-account",
  "/api/stats",
];

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Run locale middleware first (for all non-API requests)
  if (!pathname.startsWith("/api")) {
    return intlMiddleware(req);
  }

  // Skip auth check for exempted API paths
  if (exemptedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  let token = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawToken = authHeader.split(" ")[1];
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'mySuperSecretKey1234567890');
      const { payload } = await jwtVerify(rawToken, secret);
      token = payload
    } catch (err) {
      return NextResponse.json({ error: err.message || "Invalid or expired token" }, { status: 401 });
    }
  }


  if (!token) {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Add user details to headers
  const headers = new Headers(req.headers);
  headers.set("user-id", token.id);
  headers.set("email", token.email);
  headers.set("role", token.role);
  const modifiedRequest = new Request(req, { headers });

  return NextResponse.next({ request: modifiedRequest });
}

export const config = {
  matcher: [
    // API routes (for JWT auth)
    "/api/:path*",

    // next-intl locale handling
    "/",
    "/(en|tr|el)/:path*",
    "/((?!api|_next|_vercel|.*\\.|favicon.ico).*)"
  ]
};
