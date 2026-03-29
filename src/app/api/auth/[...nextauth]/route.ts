import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { Adapter } from "next-auth/adapters";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "explorer@sonicatlas.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // Check if user exists
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                // If user doesn't exist, CREATE them (SignUp/Login hybrid for testing)
                // In a production app, this would be a separate signup flow
                if (!user || !user.password) {
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    const newUser = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            name: credentials.email.split("@")[0], // default name to first part of email
                            password: hashedPassword,
                        }
                    });
                    return {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                    };
                }

                // User exists, verify password
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                (session.user as { id?: string }).id = token.sub;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
