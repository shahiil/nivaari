import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/mongodb";

export const SESSION_COOKIE_NAME = "nivaari_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
  name?: string;
};

let secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (secretKey) {
    return secretKey;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }

  secretKey = new TextEncoder().encode(secret);
  return secretKey;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const session = payload as SessionPayload;

    if (!session?.sub || !session.email || !session.role) {
      return null;
    }

    return session;
  } catch (error) {
    // Token invalid or expired; clear cookie.
    await clearSessionCookie();
    return null;
  }
}

export async function refreshSessionCookie(payload: SessionPayload): Promise<void> {
  await setSessionCookie(payload);
}
