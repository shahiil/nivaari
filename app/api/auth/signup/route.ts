import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { z } from "zod";

import { createUser, findUserByEmail, updateUserStatus, ensureDefaultAdmin } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    // Ensure default admin exists
    await ensureDefaultAdmin();

    // Pre-check required session secret to avoid creating user then failing to set cookie
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfigured: JWT_SECRET is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(parsed.data.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    let newUser;
    try {
      newUser = await createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: "citizen",
        status: "online",
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 }
        );
      }
      throw error;
    }

    await setSessionCookie({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    await updateUserStatus(newUser.id, "online");

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Signup error", error);
    // If it's a Zod error it was already handled above; otherwise, generic fallback
    let message = "Failed to create account";
    if (typeof error === 'object' && error) {
      const maybeMsg = (error as { message?: unknown }).message;
      if (typeof maybeMsg === 'string' && maybeMsg.includes('Password must be at least')) {
        message = maybeMsg;
      }
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
