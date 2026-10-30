import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Brnsic",
  description: "Brnsic Web Player with full songs, smart recommendations, and synchronized lyrics.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: [
      { url: "/app-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brnsic",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/app-icon.png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/app-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Brnsic" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased bg-black text-white overflow-hidden select-none" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
