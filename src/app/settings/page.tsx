"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useGalaxyStore } from "@/lib/store/galaxy"; 
import Button from "@/components/ui/Button";
import { 
  ArrowLeft, Volume2, VolumeX, ShieldAlert, 
  Eye, EyeOff, Eraser, Trash2, LogOut, AlertTriangle,
  // [NEW] Icons for new settings
  Type, MousePointerClick, Sparkles
} from "lucide-react";
import { signOut } from "next-auth/react";

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
    
    // [NEW] Visual & Input Settings
    inputMode,
    toggleInputMode,
    textSize,
    toggleTextSize,
    highlightCompletions,
    toggleHighlightCompletions,
    
    // Actions
    clearGame,
    resetProgress,
    logout // [NEW] Import logout action to clear local state
  } = useStore();

  // 2. GET GALAXY RESET ACTION
  const { resetGalaxy } = useGalaxyStore();

  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Prevent Hydration mismatch for toggles
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle the Actual Reset
  const executeFactoryReset = async () => {
    if (deleteConfirmationText !== "DELETE") return;
    
    setIsResetting(true);
    try {
        // 3. WIPE BOTH STORES
        resetGalaxy(); // Clears Planets & Stars
        await resetProgress(); // Clears XP, Currency, Themes
        
        // Force hard reload to clear any lingering client state/cache
        window.location.href = "/"; 
    } catch (error) {
        console.error("Reset failed:", error);
        alert("Reset failed. Please try again.");
        setIsResetting(false);
        setShowDeleteModal(false);
    }
  };

  // [NEW] Handle Secure Sign Out (Fixes persistence bug)
  const handleSignOut = () => {
      // 1. Wipe Local Data
      logout();
      // 2. Sign Out of NextAuth (Clears Session Cookie)
      signOut({ callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 pb-[env(safe-area-inset-bottom)]">
      
      {/* --- CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-900/20 transform transition-all scale-100">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <AlertTriangle size={28} />
                    <h2 className="text-xl font-bold font-mono tracking-wider">FACTORY RESET</h2>
                </div>
                
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    This will permanently delete your <span className="text-white font-bold">XP, ELO, Currency, Themes, and Galaxy Progress</span>. 
                    This action cannot be undone.
                </p>

                <div className="space-y-2 mb-6">
                    <label className="text-xs uppercase tracking-widest text-red-400/60 font-bold">
                        Type "DELETE" to confirm
                    </label>
                    <input 
                        type="text" 
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-red-200 placeholder:text-red-900/50 focus:outline-none focus:border-red-500 font-mono tracking-widest text-center uppercase"
                    />
                </div>

                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            setShowDeleteModal(false); 
                            setDeleteConfirmationText("");
                        }}
                        className="w-1/2"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={executeFactoryReset}
                        disabled={deleteConfirmationText !== "DELETE" || isResetting}
                        className={`w-1/2 ${deleteConfirmationText === "DELETE" ? "bg-red-600 hover:bg-red-500 border-red-500" : "opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500"}`}
                    >
                        {isResetting ? "WIPING..." : "CONFIRM"}
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 pt-4 md:pt-0">
            <Link href="/dashboard" className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700 active:scale-95 transition-all text-white/70 hover:text-white">
                <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest">
                SYSTEM SETTINGS
            </h1>
        </div>

        {/* SECTION 1: SENSORY INPUT */}
        <section className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Sensory Input
            </h2>
            
            <ToggleRow 
                icon={audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                title="Sound Effects"
                subtitle="Procedural audio generation"
                isActive={mounted && audioEnabled}
                onToggle={toggleAudio}
                activeColor="text-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                knobColor="bg-cyan-400"
            />
            
            <div className="w-full h-px bg-white/5" />

            {/* [NEW] Completion Highlights Toggle */}
            <ToggleRow 
                icon={<Sparkles size={24} />}
                title="Completion Effects"
                subtitle="Visual/Audio feedback for rows & boxes"
                isActive={mounted && highlightCompletions}
                onToggle={toggleHighlightCompletions}
                activeColor="text-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.3)]"
                knobColor="bg-fuchsia-400"
            />
        </section>

        {/* SECTION 2: NEURAL INTERFACE */}
        <section className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Neural Interface
            </h2>
            
            {/* [NEW] Digit-First Input Toggle */}
            <ToggleRow 
                icon={<MousePointerClick size={24} />}
                title="Digit-First Input"
                subtitle="Select number first, then fill cells"
                isActive={mounted && inputMode === 'digit-first'}
                onToggle={toggleInputMode}
                activeColor="text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                knobColor="bg-emerald-400"
            />

            <div className="w-full h-px bg-white/5" />

            {/* [NEW] Large Text Toggle */}
            <ToggleRow 
                icon={<Type size={24} />}
                title="Large Text Mode"
                subtitle="Enhanced visibility for grid numbers"
                isActive={mounted && textSize === 'large'}
                onToggle={toggleTextSize}
                activeColor="text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)]"
                knobColor="bg-orange-400"
            />

            <div className="w-full h-px bg-white/5" />

            <ToggleRow 
                icon={timerVisible ? <Eye size={24} /> : <EyeOff size={24} />}
                title="Visible Timer"
                subtitle="Show elapsed time during protocols"
                isActive={mounted && timerVisible}
                onToggle={toggleTimer}
                activeColor="text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                knobColor="bg-teal-400"
            />

            <div className="w-full h-px bg-white/5" />

            <ToggleRow 
                icon={<Eraser size={24} />}
                title="Auto-Erase Notes"
                subtitle="Remove matching notes on input"
                isActive={mounted && autoEraseNotes}
                onToggle={toggleAutoErase}
                activeColor="text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.3)]"
                knobColor="bg-indigo-400"
            />
        </section>

        {/* SECTION 3: SESSION MANAGEMENT */}
        <section className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Session Link
            </h2>
            
            <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
                        <LogOut size={24} />
                    </div>
                    <div>
                        <div className="text-white font-bold text-lg">Disconnect</div>
                        <div className="text-xs text-slate-500">Sign out of neural link</div>
                    </div>
                </div>
                <button 
                    onClick={handleSignOut}
                    className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-sm transition-all active:scale-95"
                >
                    Sign Out
                </button>
            </div>
        </section>

        {/* SECTION 4: DANGER ZONE */}
        <section className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 md:p-8 space-y-8">
            <h2 className="text-xs font-bold text-red-400/60 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert size={14} /> Danger Zone
            </h2>

            {/* Clear Game */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-red-100 font-bold">Abandon Session</div>
                    <div className="text-xs text-red-200/40">Resets the active game board only</div>
                </div>
                <Button 
                    variant="secondary" 
                    onClick={clearGame} 
                    className="text-xs h-9 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                >
                    Clear
                </Button>
            </div>

            {/* FACTORY RESET */}
            <div className="flex items-center justify-between pt-6 border-t border-red-500/10">
                <div>
                    <div className="text-red-500 font-bold flex items-center gap-2">
                        Factory Reset
                    </div>
                    <div className="text-xs text-red-400/50 mt-1 max-w-[200px] md:max-w-none">
                        Irreversible data wipe.
                    </div>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-90 border border-red-500/20 hover:border-red-500"
                  aria-label="Factory Reset"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </section>

        {/* FOOTER INFO */}
        <div className="text-center text-xs text-slate-700 font-mono pb-8">
            KU-SUDOKU v1.0.4 • THE VOID PROTOCOL
        </div>

      </div>
    </main>
  );
}

// --- REUSABLE TOGGLE COMPONENT (iOS Style) ---
function ToggleRow({ icon, title, subtitle, isActive, onToggle, activeColor, knobColor }: any) {
    return (
        <div 
            className="flex items-center justify-between cursor-pointer group select-none"
            onClick={onToggle}
        >
            <div className="flex items-center gap-5">
                <div className={`
                    p-3 rounded-2xl transition-all duration-300
                    ${isActive ? `bg-slate-800 ${activeColor}` : 'bg-slate-800/50 text-slate-500'}
                `}>
                    {icon}
                </div>
                <div>
                    <div className={`text-lg font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {title}
                    </div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        {subtitle}
                    </div>
                </div>
            </div>
            
            {/* iOS Switch */}
            <div className={`
                relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out
                ${isActive ? 'bg-slate-700' : 'bg-slate-800'}
                border border-white/5
            `}>
                <div className={`
                    absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1)
                    ${isActive ? `translate-x-6 ${knobColor || 'bg-white'}` : 'translate-x-0 bg-slate-500'}
                `} />
            </div>
        </div>
    );
}