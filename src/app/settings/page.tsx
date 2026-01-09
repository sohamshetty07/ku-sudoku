"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Button from "@/components/ui/Button";
import { ArrowLeft, Volume2, VolumeX, ShieldAlert, Eye, EyeOff, Eraser, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { 
    // Audio
    audioEnabled, 
    toggleAudio,
    
    // Gameplay
    timerVisible, 
    toggleTimer,
    autoEraseNotes, 
    toggleAutoErase,
    
    // Actions
    clearGame,
    resetProgress 
  } = useStore();

  // Loading state for the async reset
  const [isResetting, setIsResetting] = useState(false);

  // Handle the confirmation dialog & Async Reset
  const handleHardReset = async () => {
    if (window.confirm("WARNING: This will delete ALL progress, currency, and unlocked themes. This cannot be undone.")) {
      setIsResetting(true);
      
      try {
        await resetProgress(); // Wait for server to finish
        alert("System reset complete. Welcome back to the void.");
        
        // Force reload to ensure a clean slate and re-sync
        window.location.reload();
      } catch (error) {
        console.error("Reset failed:", error);
        alert("Reset failed. Please try again.");
        setIsResetting(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8 animate-fade-in">
      
      <div className="max-w-lg mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft size={24} className="text-white/70" />
            </Link>
            <h1 className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest">
                SYSTEM SETTINGS
            </h1>
        </div>

        {/* SECTION 1: SENSORY INPUT */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Sensory Input
            </h2>
            
            <ToggleRow 
                icon={audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                title="Sound Effects"
                subtitle="Procedural audio generation"
                isActive={audioEnabled}
                onToggle={toggleAudio}
                activeColor="text-neon-cyan"
            />
        </div>

        {/* SECTION 2: NEURAL INTERFACE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Neural Interface
            </h2>
            
            {/* Timer Toggle */}
            <ToggleRow 
                icon={timerVisible ? <Eye size={24} /> : <EyeOff size={24} />}
                title="Visible Timer"
                subtitle="Show elapsed time during protocols"
                isActive={timerVisible}
                onToggle={toggleTimer}
                activeColor="text-teal-400"
            />

            {/* Auto-Erase Toggle */}
            <ToggleRow 
                icon={<Eraser size={24} />}
                title="Auto-Erase Notes"
                subtitle="Remove matching notes on input"
                isActive={autoEraseNotes}
                onToggle={toggleAutoErase}
                activeColor="text-indigo-400"
            />
        </div>

        {/* SECTION 3: DANGER ZONE */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-xs font-bold text-red-400/60 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={14} /> Danger Zone
            </h2>

            {/* Clear Active Session */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-white/80 font-bold">Abandon Session</div>
                    <div className="text-xs text-white/40">Clears current game state</div>
                </div>
                <Button variant="secondary" onClick={clearGame} className="text-xs h-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20">
                    Clear Game
                </Button>
            </div>

            {/* FACTORY RESET (ASYNC) */}
            <div className="flex items-center justify-between pt-4 border-t border-red-500/10">
                <div>
                    <div className="text-red-400 font-bold">Factory Reset</div>
                    <div className="text-xs text-red-400/50">Wipe all XP, Themes & Data</div>
                </div>
                <button 
                  onClick={handleHardReset}
                  disabled={isResetting}
                  className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isResetting 
                        ? 'bg-red-500 text-white cursor-wait' 
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                    }
                  `}
                  title="Reset Everything"
                >
                    {isResetting ? (
                        <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Trash2 size={18} />
                    )}
                </button>
            </div>
        </div>

      </div>
    </main>
  );
}

// --- HELPER COMPONENT ---
function ToggleRow({ icon, title, subtitle, isActive, onToggle, activeColor }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full transition-colors ${isActive ? `bg-white/10 ${activeColor}` : 'bg-white/5 text-white/30'}`}>
                    {icon}
                </div>
                <div>
                    <div className="text-white font-bold">{title}</div>
                    <div className="text-xs text-white/50">{subtitle}</div>
                </div>
            </div>
            
            <button 
                onClick={onToggle}
                className={`
                    w-14 h-8 rounded-full p-1 transition-colors duration-300
                    ${isActive ? 'bg-white/20' : 'bg-white/5'}
                `}
            >
                <div className={`
                    w-6 h-6 rounded-full shadow-md transform transition-transform duration-300
                    ${isActive ? `translate-x-6 bg-current ${activeColor}` : 'translate-x-0 bg-white/50'}
                `} />
            </button>
        </div>
    );
}