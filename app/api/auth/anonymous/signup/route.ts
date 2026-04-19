import { NextResponse } from "next/server";

import { createAnonymousUser, updateUserStatus } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfigured: JWT_SECRET is not set" },
        { status: 500 }
      );
    }

    const created = await createAnonymousUser();
    const userId = created.user.id;

    await updateUserStatus(userId, "online");

    await setSessionCookie({
      sub: userId,
      email: created.user.email,
      role: created.user.role,
      name: created.user.name,
    });

    return NextResponse.json({
      user: {
        ...created.user,
        status: "online",
        lastLoginAt: new Date().toISOString(),
      },
      credentials: {
        socialId: created.user.socialId,
        recoveryKey: created.recoveryKey,
      },
    });
  } catch (error) {
    console.error("Anonymous signup error", error);
    return NextResponse.json(
      { error: "Failed to create anonymous identity" },
      { status: 500 }
    );
  }
}
