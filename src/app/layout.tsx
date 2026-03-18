import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import AppContent from "@/components/AppContent";

// Using system font families for build stability
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "Avent Ridge",
  description: "Avent Ridge Trading Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Avent Ridge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <AppContent>
            {children}
          </AppContent>
        </Providers>
      </body>
    </html>
  );
}
