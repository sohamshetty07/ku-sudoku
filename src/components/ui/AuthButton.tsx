"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useStore } from "@/lib/store"; 
import Button from "./Button";

export default function AuthButton() {
  const { data: session, status } = useSession();
  
  // We only need elo/xp for the UI display.
  // The 'syncFromCloud' function was removed from the store, so we remove it here too.
  const { elo, xp } = useStore();

  // --- HANDLER: SIGN OUT ---
  const handleSignOut = async () => {
    // 1. Clear Local Storage first (So when we come back, we are clean)
    // This ensures the next user doesn't see the previous user's cached state
    useStore.persist.clearStorage();
    
    // 2. Sign Out completely. 
    // passing { callbackUrl: '/' } ensures we are redirected to Home after logout
    await signOut({ callbackUrl: '/' }); 
  };

  // --- RENDER: LOGGED IN ---
  if (status === "authenticated" && session.user) {
    return (
      <div className="flex flex-col gap-3 w-full animate-fade-in">
        <div className="flex items-center justify-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
            {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={session.user.image} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-white/20" 
                />
            )}
            <div className="flex flex-col text-left">
                <span className="text-white/90 text-sm font-medium">
                  {session.user.name}
                </span>
                <div className="flex gap-3 text-xs font-mono opacity-80">
                   <span className="text-neon-cyan">ELO: {elo}</span>
                   <span className="text-purple-400">XP: {xp}</span>
                </div>
            </div>
        </div>
        
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={handleSignOut} 
          className="text-xs"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  // --- RENDER: LOADING ---
  if (status === "loading") {
    return <Button variant="glass" fullWidth disabled>Connecting...</Button>;
  }

  // --- RENDER: LOGGED OUT ---
  return (
    <Button 
      variant="glass" 
      fullWidth 
      onClick={() => signIn("google")}
    >
      Sign In / Sync
    </Button>
  );
}