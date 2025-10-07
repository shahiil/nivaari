import { NextResponse } from "next/server";
import { z } from "zod";

import {
  mapUser,
  updateUserStatus,
  verifyUserCredentials,
  ensureDefaultAdmin,
} from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    // Ensure default admin exists so they can login immediately
    await ensureDefaultAdmin();

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

    const userDoc = await verifyUserCredentials(parsed.data.email, parsed.data.password);

    if (!userDoc || !userDoc._id) {
      return NextResponse.json(
        { error: "Invalid email or password" },
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
    console.error("Login error", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
