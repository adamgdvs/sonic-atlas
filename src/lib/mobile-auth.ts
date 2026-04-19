import { jwtVerify, SignJWT } from "jose";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ACCESS_TOKEN_EXPIRATION = "12h";
const REFRESH_TOKEN_EXPIRATION = "30d";
const TOKEN_AUDIENCE = "sonic-atlas-mobile";
const TOKEN_ISSUER = "sonic-atlas-api";

type TokenKind = "access" | "refresh";

export type ApiAuthUser = {
  email: string | null;
  id: string;
  name: string | null;
};

function getMobileJwtSecret() {
  const secret =
    process.env.MOBILE_AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Missing MOBILE_AUTH_SECRET or NEXTAUTH_SECRET");
  }

  return new TextEncoder().encode(secret);
}

function mapUser(user: { email?: string | null; id: string; name?: string | null }): ApiAuthUser {
  return {
    email: user.email ?? null,
    id: user.id,
    name: user.name ?? null,
  };
}

async function createToken(user: ApiAuthUser, tokenKind: TokenKind, expiresIn: string) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    tokenKind,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(TOKEN_AUDIENCE)
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setSubject(user.id)
    .sign(getMobileJwtSecret());
}

async function verifyToken(token: string, tokenKind: TokenKind): Promise<ApiAuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getMobileJwtSecret(), {
      audience: TOKEN_AUDIENCE,
      issuer: TOKEN_ISSUER,
    });

    if (payload.tokenKind !== tokenKind || typeof payload.sub !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        email: true,
        id: true,
        name: true,
      },
    });

    return user ? mapUser(user) : null;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function issueMobileTokens(user: ApiAuthUser) {
  const [accessToken, refreshToken] = await Promise.all([
    createToken(user, "access", ACCESS_TOKEN_EXPIRATION),
    createToken(user, "refresh", REFRESH_TOKEN_EXPIRATION),
  ]);

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRATION,
    refreshToken,
    user,
  };
}

export async function refreshMobileTokens(refreshToken: string) {
  const user = await verifyToken(refreshToken, "refresh");
  if (!user) {
    return null;
  }

  return issueMobileTokens(user);
}

export async function getRequestUser(request: Request): Promise<ApiAuthUser | null> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    return verifyToken(bearerToken, "access");
  }

  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    return null;
  }

  return mapUser({
    email: sessionUser.email,
    id: sessionUser.id,
    name: sessionUser.name,
  });
}
