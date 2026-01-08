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
    // EXTENDED CACHING RULES
    runtimeCaching: [
      {
        // Rule 1: Game Pages (Fixes the Offline Mode Crash)
        // Matches any URL starting with /game
        urlPattern: ({ url }) => url.pathname.startsWith("/game"),
        handler: "NetworkFirst", // Try internet first, fallback to offline cache
        options: {
          cacheName: "game-pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
          // CRITICAL FIX: This ignores '?mode=Relaxed' when looking in the cache
          matchOptions: {
            ignoreSearch: true,
          },
        },
      },
      {
        // Rule 2: Static Assets (Images, Fonts, JS, CSS)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i,
        handler: "StaleWhileRevalidate", // Use cache immediately, update in background
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 200 },
        },
      },
      {
        // Rule 3: Catch-all for other pages
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