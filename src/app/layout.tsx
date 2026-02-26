import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import NextAuthSessionProvider from "./components/SessionProvider";

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
    icon: "/favicon2.png",
  },
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
          <Sidebar />
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
