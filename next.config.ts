import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // Your existing config here (if any)
  reactStrictMode: true,
};

// Wrap the config with the PWA plugin
export default withPWA({
  dest: "public",         // Where to put the service worker files
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in local dev mode
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);