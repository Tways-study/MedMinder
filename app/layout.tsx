import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Karla, Petrona } from "next/font/google";
import "./globals.css";

/*
  Petrona for headings: a warm, slightly irregular serif that reads hand-set
  rather than corporate, which is the register of an apothecary label. Used at
  heading sizes only — never for data.
*/
const petrona = Petrona({
  variable: "--font-petrona",
  subsets: ["latin"],
  display: "swap",
});

/* Karla for body: a grotesque with enough character to not read as a default. */
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

/* Plex Mono for lot numbers, expiry dates and quantities — tabular figures. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedMinder",
  description: "Medicine inventory and expiry tracking for community pharmacy.",
};

export const viewport: Viewport = {
  // Used one-handed at a shelf; let the phone size it properly.
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F3F9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${petrona.variable} ${karla.variable} ${plexMono.variable} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
