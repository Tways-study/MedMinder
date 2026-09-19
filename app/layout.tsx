import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/*
  The system face comes first: on an iPhone or Mac that is SF Pro, with its
  optical sizes and tracking tables. Inter only fills in on devices without
  it, so it is loaded as a fallback, not as the identity.
*/
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedMinder",
  description: "Medicine inventory and expiry tracking for community pharmacies.",
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
      {/* On <html>, not <body>: --font-sans on :root references --font-inter. */}
      <html lang="en" className={inter.variable}>
        <body className="antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
