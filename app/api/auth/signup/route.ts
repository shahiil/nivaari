import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { z } from "zod";

import { createUser, findUserByEmail, updateUserStatus } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
