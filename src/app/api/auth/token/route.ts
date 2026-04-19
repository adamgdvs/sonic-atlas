import { NextResponse } from "next/server";

import { authenticateWithCredentials } from "@/lib/credentials-auth";
import { issueMobileTokens, refreshMobileTokens } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await authenticateWithCredentials({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(await issueMobileTokens(user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";

    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      refreshToken?: string;
    };

    if (!body.refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
    }

    const tokens = await refreshMobileTokens(body.refreshToken);

    if (!tokens) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
