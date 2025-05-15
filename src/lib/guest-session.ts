import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export function guestSessionMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = request.cookies.get("next-auth.session-token");

  // Skip if user is authenticated
  if (session) return response;

  // Check for existing guest ID
  let guestId = request.cookies.get("guestId")?.value;
  let guestHistory = request.cookies.get("guestHistory")?.value;

  // Create new guest session if needed
  if (!guestId) {
    guestId = uuidv4();
    response.cookies.set("guestId", guestId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  // Initialize guest history if needed
  if (!guestHistory) {
    guestHistory = JSON.stringify({ seenOppIds: [], likedOppIds: [] });
    response.cookies.set("guestHistory", guestHistory, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}
