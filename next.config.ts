import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default withPWA({
  dest: "public",
  // Core PWA Settings
  cacheOnFrontEndNav: true, // [CHANGED] Enable this for smoother transitions offline
  aggressiveFrontEndNavCaching: true, // [CHANGED] Pre-cache nearby pages
  
  reloadOnOnline: false, // [CHANGED] Don't force reload when wifi comes back (interrupts gameplay)
  disable: process.env.NODE_ENV === "development",
  
  workboxOptions: {
    disableDevLogs: true,
    
    // EXTENDED RULESET
    runtimeCaching: [
      {
        // RULE 1: ASSETS (JS, CSS, IMAGES, FONTS)
        // Strategy: CacheFirst (Serve from cache immediately)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|json)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          },
        },
      },
      {
        // RULE 2: APP PAGES (HTML)
        // Strategy: NetworkFirst (Try internet -> Fallback to Cache)
        urlPattern: ({ url }) => {
          const pathname = url.pathname;
          return (
            pathname === "/" ||
            pathname.startsWith("/game") || 
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/observatory") || // Shop
            pathname.startsWith("/leaderboard") || // Apex
            pathname.startsWith("/stats") ||       // Archives
            pathname.startsWith("/settings")       // Config
          );
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          // [OPTIMIZATION] Wait only 3s for internet. 
          // If slow, show cached game immediately so user can play.
          networkTimeoutSeconds: 3, 
        },
      },
      {
        // RULE 3: NEXT.JS DATA (JSON)
        // Strategy: NetworkFirst
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 Hours
          },
        },
      },
      {
        // RULE 4: API CALLS (Leaderboard, Sync)
        // Strategy: NetworkFirst 
        // (Allows viewing old Leaderboard data if offline)
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24, // 24 Hours
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // RULE 5: EXTERNAL FONTS (Google Fonts)
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          },
        },
      },
    ],
  },
})(nextConfig);