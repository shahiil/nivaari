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

    if (error && typeof error === "object") {
      const maybeError = error as { code?: unknown; syscall?: unknown };
      if (maybeError.code === "ECONNREFUSED" && maybeError.syscall === "querySrv") {
        return NextResponse.json(
          {
            error:
              "Database DNS lookup failed. If you are using mongodb+srv, provide MONGODB_URI_FALLBACK with a standard mongodb:// host list URI.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create anonymous identity" },
      { status: 500 }
    );
  }
}
