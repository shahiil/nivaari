import { NextResponse } from "next/server";

import { findUserById, mapUser } from "@/lib/auth-service";
import { clearSessionCookie, getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.sub) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await findUserById(session.sub);

    if (!user) {
      await clearSessionCookie();
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: mapUser(user) });
  } catch (error) {
    console.error("Session lookup error", error);
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
