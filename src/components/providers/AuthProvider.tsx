"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";

// 1. Inner Component to handle Advanced Sync Logic
function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  // [UPDATED] Observe hydration state to ensure we don't sync empty stores
  const { pushSync, hasHydrated } = useStore(); 
  
  // Ref to throttle sync calls (prevent spamming server on rapid tab switching)
  const lastSyncTime = useRef<number>(0);
  const SYNC_COOLDOWN = 10000; // 10 seconds

  const triggerSync = useCallback(async () => {
    // Only sync if logged in AND hydrated
    if (status !== "authenticated" || !session?.user || !hasHydrated) return;

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
  }, [status, session, hasHydrated, pushSync]);

  useEffect(() => {
    // 1. Sync immediately on mount/login/hydration
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
      // [UPDATED] Force sync to bypass cooldown if user was offline
      lastSyncTime.current = 0; 
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