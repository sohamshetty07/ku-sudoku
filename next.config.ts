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
        // RULE 1: CACHE ALL PAGES & DATA
        // If the browser requests a Page (HTML) or Next.js Data (JSON), cache it.
        // This covers /, /game, /dashboard, and any future pages automatically.
        urlPattern: ({ request, url }) => {
          return request.mode === "navigate" || url.pathname.startsWith("/_next/data/");
        },
        handler: "NetworkFirst", // Try internet first -> Fallback to Cache
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
          matchOptions: {
            ignoreSearch: true, // Fixes the ?mode=Relaxed crash
          },
        },
      },
      {
        // RULE 2: STATIC ASSETS (Images, Styles, Scripts)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 200 },
        },
      },
      {
        // RULE 3: CATCH-ALL (Safety Net)
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