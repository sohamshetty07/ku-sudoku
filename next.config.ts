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
  
  // This forces the Service Worker to take control immediately
  // preventing the "need to refresh twice" issue.
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    
    runtimeCaching: [
      {
        // RULE 1: STATIC ASSETS (JS, CSS, Images)
        // Strategy: CacheFirst
        // These files have hashes in their names (e.g., app-a1b2.js), so they never change.
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
      {
        // RULE 2: APP PAGES & DATA
        // Strategy: StaleWhileRevalidate
        // Meaning: "Serve the cached version INSTANTLY, then update it in the background."
        urlPattern: ({ url }) => {
          return (
            url.pathname === "/" ||
            url.pathname.startsWith("/game") || 
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/_next/data/") 
          );
        },
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          // CRITICAL: Tells the cache that "/game?mode=Relaxed" 
          // is the same app page as "/game".
          matchOptions: {
            ignoreSearch: true,
          },
        },
      },
      {
        // RULE 3: API CALLS (If you have any)
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
      {
        // RULE 4: CATCH-ALL
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: { maxEntries: 200 },
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
})(nextConfig);