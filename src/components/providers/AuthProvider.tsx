"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";

// 1. Inner Component to handle Advanced Sync Logic
function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { pushSync } = useStore();
  
  // Ref to throttle sync calls (prevent spamming server on rapid tab switching)
  const lastSyncTime = useRef<number>(0);
  const SYNC_COOLDOWN = 10000; // 10 seconds

  const triggerSync = useCallback(async () => {
    // Only sync if logged in
    if (status !== "authenticated" || !session?.user) return;

    const now = Date.now();
    // Throttle check
    if (now - lastSyncTime.current < SYNC_COOLDOWN) {
      return;
    }

    try {
      lastSyncTime.current = now;
      await pushSync();
    } catch (error) {
      console.error("Auto-sync failed:", error);
    }
  }, [status, session, pushSync]);

  useEffect(() => {
    // 1. Sync immediately on mount/login
    triggerSync();

    // 2. Event Handlers for PWA/Mobile Lifecycle
    const onFocus = () => {
      // Sync when user comes back to the tab/app
      triggerSync();
    };

    const onVisibilityChange = () => {
      // Sync when app becomes visible (iOS PWA switching)
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };

    const onOnline = () => {
      // Sync when internet connection is restored
      console.log("Network restored. Syncing...");
      triggerSync();
    };

    // 3. Attach Listeners
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 4. Cleanup
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [triggerSync]);

  return <>{children}</>;
}

// 2. Main Provider Wrapper
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>
        {children}
      </AuthSync>
    </SessionProvider>
  );
}