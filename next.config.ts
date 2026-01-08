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
        // RULE 1: CRITICAL PAGES (Dashboard, Game, Home)
        // Strategy: StaleWhileRevalidate
        // Meaning: "Serve from cache IMMEDIATELY. Don't wait for the internet."
        urlPattern: ({ url }) => {
          return (
            url.pathname === "/" ||
            url.pathname.startsWith("/game") || 
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/_next/data/") // Essential for Next.js transitions
          );
        },
        handler: "StaleWhileRevalidate", 
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          // CRITICAL: Treat /game?mode=Relaxed the same as /game
          matchOptions: {
            ignoreSearch: true,
          },
        },
      },
      {
        // RULE 2: STATIC ASSETS (Images, Fonts, CSS, JS)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 200 },
        },
      },
      {
        // RULE 3: CATCH-ALL (Everything else)
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: { maxEntries: 200 },
          networkTimeoutSeconds: 3, // Wait 3s for internet, then fail to cache
        },
      },
    ],
  },
})(nextConfig);