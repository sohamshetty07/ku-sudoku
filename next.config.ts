import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This helps prevent hydration mismatches which can sometimes look like SW errors
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default withPWA({
  dest: "public",
  // DISABLE THESE for now. They are aggressive and can cause the "no-response" error
  // if the cache isn't perfectly primed.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  
  workboxOptions: {
    disableDevLogs: true,
    
    // EXTENDED RULESET
    runtimeCaching: [
      {
        // RULE 1: JS, CSS, IMAGES (The "App Shell" Assets)
        // Strategy: CacheFirst
        // These file names have hashes (e.g. main-x82z.js), so they never change.
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
        // RULE 2: PAGES (HTML) - Dashboard, Game, Home
        // Strategy: NetworkFirst (The "Safe" Offline Mode)
        // Try to fetch from internet. If offline, use the cached version.
        urlPattern: ({ url }) => {
          return (
            url.pathname === "/" ||
            url.pathname.startsWith("/game") || 
            url.pathname.startsWith("/dashboard")
          );
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          networkTimeoutSeconds: 5, // Wait 5s for internet, then use cache
        },
      },
      {
        // RULE 3: NEXT.JS DATA (JSON data for page transitions)
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
        // RULE 4: API CALLS
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        // RULE 5: EVERYTHING ELSE
        urlPattern: ({ url }) => !url.pathname.startsWith('/api'), 
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: { maxEntries: 200 },
        },
      },
    ],
  },
})(nextConfig);