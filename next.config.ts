import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // RULE 1: IMAGES, FONTS, SCRIPTS, STYLES (Static Assets)
      // Strategy: CacheFirst
      // Why: These files have hash names (e.g., main-123.js). They never change.
      // If we have it, use it. This prevents the "flicker" or reloading issues.
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { 
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          },
        },
      },
      // RULE 2: PAGES & DATA (The Game Logic)
      // Strategy: NetworkFirst
      // Why: Try to get the latest version. If Offline, use the cached version.
      // This fixes the "refresh loop" because it prioritizes consistency.
      {
        urlPattern: ({ url }) => {
          return (
            url.pathname === "/" ||
            url.pathname.startsWith("/game") || 
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/_next/data/") // Critical for avoiding blank screens
          );
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          // CRITICAL FIX: This prevents crashes on /game?mode=Relaxed
          matchOptions: {
            ignoreSearch: true,
          },
          networkTimeoutSeconds: 3, // Fallback to cache fast if internet is slow
        },
      },
      // RULE 3: CATCH-ALL
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: { maxEntries: 200 },
        },
      },
    ],
  },
})(nextConfig);