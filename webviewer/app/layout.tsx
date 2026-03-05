import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import HeaderCTA from "./HeaderCTA";
import HeaderStripe from "./HeaderStripe";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenLoom — Open Source Video Messaging",
  description: "Open-source Loom alternative you self-host. Own your threads.",
  metadataBase: new URL("https://openloom.live"),
  openGraph: {
    title: "OpenLoom — Open Source Video Messaging",
    description: "Open-source Loom alternative you self-host. Own your threads.",
    url: "https://openloom.live",
    siteName: "OpenLoom",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenLoom — Open Source Video Messaging",
    description: "Open-source Loom alternative you self-host. Own your threads.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-[var(--warp-indigo)] text-[var(--cotton)]`}
      >
        <header className="sticky top-0 z-50">
          <nav className="flex h-14 items-center justify-between bg-[var(--warp-indigo)] px-6">
            <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between">
              <Link
                href="/"
                className="font-mono text-[1.575rem] font-bold tracking-tight"
              >
                <span className="text-[var(--cotton)]">Open</span>
                <span className="text-[var(--cotton)]/40">Loom</span>
              </Link>
              <HeaderCTA />
            </div>
          </nav>
          <HeaderStripe />
        </header>
        {children}
      </body>
    </html>
  );
}
