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
      {
        // RULE 1: Main App Pages (Home, Game, Dashboard)
        // FIX: Now includes checking for /dashboard and root /
        urlPattern: ({ url }) => 
          url.pathname === "/" || 
          url.pathname.startsWith("/game") || 
          url.pathname.startsWith("/dashboard"),
          
        handler: "NetworkFirst", // Try internet -> Fallback to Cache
        options: {
          cacheName: "app-pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
          // Allows /game?mode=Relaxed to match /game in cache
          matchOptions: {
            ignoreSearch: true,
          },
        },
      },
      {
        // RULE 2: Static Assets (Images, Fonts, JS, CSS)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 200 },
        },
      },
      {
        // RULE 3: Everything else
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