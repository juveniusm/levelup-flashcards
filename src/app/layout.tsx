import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import NextAuthSessionProvider from "./components/SessionProvider";
import CommandPalette from "./components/ui/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LevelUp Flashcards",
  description: "Advanced spaced repetition flashcards.",
  icons: {
    icon: "/Logo3.svg",
    apple: "/Logo3.svg",
  },
};

// Without this, mobile browsers render at a ~980px virtual viewport so the
// UI looks zoomed in on phones and needs pinch-to-unzoom on every page.
// We intentionally do NOT set maximumScale/userScalable — that would block
// pinch-zoom for users who rely on it for accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden bg-[#0a0a0a] text-white`}
      >
        <NextAuthSessionProvider>
          <CommandPalette />
          <Sidebar />
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
