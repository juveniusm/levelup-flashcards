import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import NextAuthSessionProvider from "./components/SessionProvider";
import CommandPalette from "./components/ui/CommandPalette";
import ProfileCompletionPrompt from "./components/ProfileCompletionPrompt";

// Fraunces is the serif display face (headings); Inter is the body sans; and
// JetBrains Mono covers code/IDs. Each exposes a CSS variable that globals.css's
// @theme block points its --font-* tokens at. Fraunces includes the optical-size
// axis so large headings keep their high-contrast letterforms.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Level Up Flashcards",
  description: "Master anything with spaced repetition",
  manifest: "/manifest.json",
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
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased flex h-screen overflow-hidden bg-background text-foreground`}
      >
        <NextAuthSessionProvider>
          <CommandPalette />
          <ProfileCompletionPrompt />
          <Sidebar />
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
