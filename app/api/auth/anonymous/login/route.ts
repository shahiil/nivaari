import { NextResponse } from "next/server";
import { z } from "zod";

import { mapUser, updateUserStatus, verifyAnonymousCredentials } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  socialId: z.string().min(1, "Social ID is required"),
  recoveryKey: z.string().min(1, "Recovery Key is required"),
});

export async function POST(request: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfigured: JWT_SECRET is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const userDoc = await verifyAnonymousCredentials(
      parsed.data.socialId,
      parsed.data.recoveryKey
    );

    if (!userDoc || !userDoc._id) {
      return NextResponse.json(
        { error: "Invalid Social ID or Recovery Key" },
        { status: 401 }
      );
    }

    const userId = userDoc._id.toString();
    await updateUserStatus(userId, "online");

    const publicUser = mapUser({
      ...userDoc,
      status: "online",
      lastLoginAt: new Date(),
    });

    await setSessionCookie({
      sub: userId,
      email: publicUser.email,
      role: publicUser.role,
      name: publicUser.name,
    });

    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error("Anonymous login error", error);
    return NextResponse.json(
      { error: "Failed to recover account" },
      { status: 500 }
    );
  }
}
