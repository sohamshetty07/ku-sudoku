import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google"; 
import "./globals.css";
// CHANGED: Renamed to ThemeManager to reflect broader responsibility
import ThemeManager from "@/components/layout/ThemeManager"; 
import AuthProvider from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ku | Sudoku",
  description: "A pure, glassmorphism Sudoku experience.",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ku",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A", // Default fallback
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased bg-[#0F172A] text-white`}
      >
        <AuthProvider>
          
          {/* THEME MANAGER: Handles Background & Meta Colors */}
          <ThemeManager />

          <main className="relative z-10 min-h-screen">
            {children}
          </main>
          
        </AuthProvider>
      </body>
    </html>
  );
}