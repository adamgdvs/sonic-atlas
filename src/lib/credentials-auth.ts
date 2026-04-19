import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  email: string | null;
  id: string;
  name: string | null;
};

type CredentialsInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function authenticateWithCredentials({
  email,
  password,
}: CredentialsInput): Promise<AuthenticatedUser> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Invalid credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Current web auth intentionally supports a signup/login hybrid for testing.
  if (!user || !user.password) {
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        password: hashedPassword,
      },
    });

    return {
      email: newUser.email,
      id: newUser.id,
      name: newUser.name,
    };
  }

  const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  return {
    email: user.email,
    id: user.id,
    name: user.name,
  };
}
