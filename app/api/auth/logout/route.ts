import { NextResponse } from "next/server";

import { updateUserStatus } from "@/lib/auth-service";
import { clearSessionCookie, getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getSession();

    if (session?.sub) {
      await updateUserStatus(session.sub, "offline");
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
