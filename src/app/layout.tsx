import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "@/providers/GlobalProviders";
import ErrorBoundary from "@/components/ErrorBoundary";

const nonSans = localFont({
  src: "../../public/fonts/NON-Sans-Medium.woff2",
  variable: "--font-non-sans",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${nonSans.variable} ${spaceMono.variable} antialiased`}>
        <GlobalProviders>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </GlobalProviders>
      </body>
    </html>
  );
}
