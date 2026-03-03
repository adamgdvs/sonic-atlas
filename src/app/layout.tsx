import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "@/providers/GlobalProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sonic Atlas — Discover Similar Artists",
  description:
    "An open-source music discovery platform for exploring similar artists, genres, and sonic neighborhoods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceMono.variable} antialiased`}>
        <GlobalProviders>
          {children}
        </GlobalProviders>
      </body>
    </html>
  );
}
