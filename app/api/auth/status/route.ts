import { NextResponse } from "next/server";
import { z } from "zod";

import { updateUserStatus } from "@/lib/auth-service";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const statusSchema = z.object({
  status: z.enum(["online", "offline"]),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await updateUserStatus(session.sub, parsed.data.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status update error", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
