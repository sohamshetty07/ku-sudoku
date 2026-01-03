import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google"; 
import "./globals.css";

// 1. Configure the UI Font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 2. Configure the Grid Number Font
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

// <--- VIEWPORT CONFIGURATION
export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // <--- This extends the background into the notch
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}