import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google"; 
import "./globals.css";
import ThemeManager from "@/components/layout/ThemeManager"; 
import AuthProvider from "@/components/providers/AuthProvider";

// --- FONTS ---
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevents invisible text flash
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// --- METADATA (SEO & PWA) ---
export const metadata: Metadata = {
  title: {
    default: "Ku | Sudoku",
    template: "%s | Ku"
  },
  description: "A high-fidelity, aesthetic-driven Sudoku experience. Enter The Void.",
  applicationName: "Ku Sudoku",
  authors: [{ name: "Soham Shetty" }], // Personalized
  manifest: "/manifest.json",
  
  // PWA: Apple Specifics
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Merges status bar with app bg
    title: "Ku",
    startupImage: [], // Can specify launch screens here if generated later
  },
  
  // Disable auto-linking (annoying in games with numbers)
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Social Sharing Cards (The Void Aesthetic)
  openGraph: {
    type: "website",
    siteName: "Ku Sudoku",
    title: "Ku | The Void Protocol",
    description: "Master the grid. Unlock the themes.",
    // images: [{ url: '/og-image.png' }], // Add this later for polish
  },
  twitter: {
    card: "summary_large_image",
    title: "Ku Sudoku",
    description: "A pure, glassmorphism Sudoku PWA.",
  }
};

// --- VIEWPORT (Mobile Polish) ---
export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents accidental pinch-zoom during play
  viewportFit: "cover", // CRITICAL: Allows drawing behind the notch/home bar
  // CRITICAL: Ensures keyboard pushes UI up instead of covering it
  interactiveWidget: "resizes-content", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`
          ${geistSans.variable} ${jetbrainsMono.variable} 
          antialiased bg-[#0F172A] text-white 
          h-full w-full overflow-hidden 
          overscroll-none select-none touch-manipulation
        `}
      >
        {/* PROVIDERS */}
        <AuthProvider>
          
          {/* VISUAL ENGINE: Handles Dynamic Backgrounds & Safe Areas */}
          <ThemeManager />

          {/* MAIN CONTENT LAYER */}
          <main className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          
        </AuthProvider>
      </body>
    </html>
  );
}