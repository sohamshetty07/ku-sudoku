"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

// 1. Inner Component to handle Sync Logic
function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { pushSync } = useStore();

  useEffect(() => {
    // If the user is logged in, trigger a full sync (Push & Pull)
    if (session?.user) {
      pushSync();
    }
  }, [session, pushSync]);

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