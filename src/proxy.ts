import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(() => NextResponse.next());

export const config = {
  matcher: ["/guides/:path*", "/diagnostics/:path*", "/tools/:path*", "/admin/:path*"],
};
