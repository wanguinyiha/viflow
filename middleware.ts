import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware disabled for dashboard preview mode
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
