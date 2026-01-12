"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link"; 
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { ARTIFACTS, type Artifact } from "@/lib/progression/constants";
import { 
  ArrowLeft, Sparkles, Zap, Hexagon, Play, XCircle, HelpCircle, Lock, Skull
} from "lucide-react";
import Button from "@/components/ui/Button";
import ExpeditionGuideModal from "@/components/game/ExpeditionGuideModal"; // [NEW] Import
import { playSfx } from "@/lib/audio";

// --- CONSTANTS ---
const MAX_SLOTS = 3;
const REQUIRED_XP = 15000;
const MYSTERY_COST = 2; // Fixed cost for random buff

// Rarity Colors
const RARITY_STYLES = {
  Common:  { border: "border-slate-500", bg: "bg-slate-500/10", text: "text-slate-400", glow: "shadow-slate-500/20" },
  Rare:    { border: "border-cyan-500",  bg: "bg-cyan-500/10",  text: "text-cyan-400",  glow: "shadow-cyan-500/20" },
  Legendary: { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/20" },
  Cursed:  { border: "border-rose-900",  bg: "bg-rose-900/20",  text: "text-rose-500",  glow: "shadow-rose-900/40" },
};

export default function ExpeditionPage() {
  const router = useRouter();
  const { 
    xp, 
    cometShards, 
    spendCurrency, 
    expedition, 
    startExpedition, 
    endExpedition,
    pushSync 
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shopOptions, setShopOptions] = useState<Artifact[]>([]);
  const [showGuide, setShowGuide] = useState(false); // [NEW] Guide State

  // --- INIT: GENERATE SHOP ---
  useEffect(() => {
    setMounted(true);
    
    // [LOGIC] 1 Common, 1 Rare/Legendary, 1 Cursed
    const commons = ARTIFACTS.filter(a => a.rarity === 'Common');
    const rares = ARTIFACTS.filter(a => a.rarity === 'Rare' || a.rarity === 'Legendary');
    const cursed = ARTIFACTS.filter(a => a.rarity === 'Cursed');

    // Safe fallback if arrays are empty
    const p1 = commons.length > 0 ? commons[Math.floor(Math.random() * commons.length)] : ARTIFACTS[0];
    const p2 = rares.length > 0 ? rares[Math.floor(Math.random() * rares.length)] : ARTIFACTS[1];
    const p3 = cursed.length > 0 ? cursed[Math.floor(Math.random() * cursed.length)] : ARTIFACTS[2];

    setShopOptions([p1, p2, p3]);
  }, []);

  // --- DERIVED STATE ---
  const isLocked = xp < REQUIRED_XP;

  // Calculate Total Cost (Artifacts + Mystery Boxes)
  const totalCost = useMemo(() => {
    return selectedIds.reduce((sum, id) => {
        // Check if it's a Mystery Box
        if (id.startsWith('mystery_')) {
            return sum + MYSTERY_COST;
        }
        // Otherwise calculate real artifact cost
        const art = ARTIFACTS.find(a => a.id === id);
        return sum + (art?.cost || 0);
    }, 0);
  }, [selectedIds]);

  const canAfford = cometShards >= totalCost;

  // --- HANDLERS ---
  
  // 1. Toggle specific shop item
  const handleSelectOption = (id: string) => {
    if (selectedIds.includes(id)) {
        playSfx('click');
        setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
        if (selectedIds.length >= MAX_SLOTS) {
            playSfx('error');
            return;
        }
        playSfx('click');
        setSelectedIds(prev => [...prev, id]);
    }
  };

  // 2. Add a Mystery Box
  const handleSelectMystery = () => {
      if (selectedIds.length >= MAX_SLOTS) {
          playSfx('error');
          return;
      }
      // Create a unique ID for this specific mystery selection
      const mysteryId = `mystery_${Date.now()}_${Math.random()}`;
      playSfx('click');
      setSelectedIds(prev => [...prev, mysteryId]);
  };

  const handleRemoveItem = (idToRemove: string) => {
      playSfx('click');
      setSelectedIds(prev => prev.filter(id => id !== idToRemove));
  };

  const handleLaunch = () => {
    if (!canAfford) {
      playSfx('error');
      return;
    }
    
    // 1. Resolve Logic: Turn 'mystery_xyz' into real artifact IDs
    const finalLoadout: string[] = [];
    const usedIds = new Set<string>(); // Track what we already picked to avoid dupes

    // First, add the specific selections
    selectedIds.forEach(id => {
        if (!id.startsWith('mystery_')) {
            finalLoadout.push(id);
            usedIds.add(id);
        }
    });

    // Second, resolve mysteries
    selectedIds.forEach(id => {
        if (id.startsWith('mystery_')) {
            // Filter pool to items NOT already in loadout
            const pool = ARTIFACTS.filter(a => !usedIds.has(a.id));
            if (pool.length > 0) {
                const randomArtifact = pool[Math.floor(Math.random() * pool.length)];
                finalLoadout.push(randomArtifact.id);
                usedIds.add(randomArtifact.id);
            }
        }
    });

    // 2. Process Transaction
    const success = spendCurrency('cometShards', totalCost);
    if (!success) return; 

    // 3. Start Run
    playSfx('heavy-impact');
    startExpedition(finalLoadout);
    
    // 4. Sync & Route
    pushSync();
    router.push('/game?mode=Expedition');
  };

  const handleResume = () => {
    router.push('/game?mode=Expedition');
  };

  const handleAbort = () => {
    playSfx('erase');
    endExpedition();
    pushSync();
  };

  // --- VIEW: LOADING / LOCKED / ACTIVE ---
  
  if (!mounted) return null;

  if (isLocked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050b14] text-white p-4">
        <div className="max-w-md w-full bg-slate-900/50 border border-white/10 rounded-3xl p-8 text-center space-y-6 backdrop-blur-xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Lock size={32} className="text-white/20" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-widest text-slate-500 uppercase">
            Clearance Denied
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The Void Expedition requires <strong>Void Walker</strong> rank authorization.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" fullWidth className="mt-4">Return to Bridge</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (expedition.isActive) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050b14] text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050b14] to-[#050b14] animate-pulse-slow pointer-events-none" />
        <div className="relative z-10 max-w-md w-full bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-8 text-center space-y-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-2">
             <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse">
                    <Hexagon size={48} strokeWidth={1.5} />
                </div>
             </div>
             <h1 className="text-3xl font-mono font-bold tracking-widest text-white uppercase">
                Expedition Active
             </h1>
             <p className="text-sm text-indigo-200/60 font-mono tracking-wider">
                SECTOR {expedition.sector} • {expedition.lives} LIVES REMAINING
             </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleResume} fullWidth className="h-14 text-lg bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30">
               <div className="flex items-center gap-3">
                 <Play size={20} className="fill-current" />
                 <span>Resume Protocol</span>
               </div>
            </Button>
            <button 
              onClick={handleAbort}
              className="w-full py-3 text-xs text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
               <XCircle size={14} /> Abort Mission
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- VIEW: DRAFTING LOBBY ---
  return (
    <main className="min-h-screen bg-[#020408] text-slate-200 pb-24">
      {/* [NEW] Guide Modal */}
      {showGuide && <ExpeditionGuideModal onClose={() => setShowGuide(false)} />}

      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-[#020408]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-300 to-rose-300">
                VOID DRAFT
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Initialize Loadout</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* [NEW] Help Button */}
            <button 
                onClick={() => { playSfx('click'); setShowGuide(true); }}
                className="p-2 rounded-full bg-slate-900 border border-white/10 text-indigo-400 hover:bg-white/10 hover:text-indigo-300 transition-colors"
                title="Mission Briefing"
             >
                <HelpCircle size={20} />
             </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <Sparkles size={14} className="text-rose-500 fill-rose-500" />
                <span className={`font-mono font-bold ${canAfford ? "text-white" : "text-red-400"}`}>
                {cometShards}
                </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* 2. Selected Loadout Slots */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">Active Modules</h2>
              <span className="text-xs font-mono text-slate-500">{selectedIds.length} / {MAX_SLOTS}</span>
           </div>
           
           <div className="grid grid-cols-3 gap-3 md:gap-6">
              {Array.from({ length: MAX_SLOTS }).map((_, i) => {
                 const id = selectedIds[i];
                 const isMystery = id?.startsWith('mystery_');
                 
                 // If normal artifact, find it. If mystery, null.
                 const artifact = (!isMystery && id) ? ARTIFACTS.find(a => a.id === id) : null;
                 const rarity = artifact ? RARITY_STYLES[artifact.rarity] : null;

                 return (
                   <div 
                     key={i}
                     onClick={() => id && handleRemoveItem(id)}
                     className={`
                        relative aspect-square md:aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer hover:border-white/30
                        ${id 
                           ? (isMystery ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg' : `${rarity?.bg} ${rarity?.border} border-solid shadow-lg`) 
                           : "border-white/10 bg-white/5"
                        }
                     `}
                   >
                      {id ? (
                        <>
                           {isMystery ? (
                               // MYSTERY PLACEHOLDER UI
                               <>
                                 <HelpCircle size={24} className="text-indigo-400 mb-2 animate-pulse" />
                                 <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Mystery</div>
                               </>
                           ) : (
                               // ARTIFACT UI
                               <>
                                 <div className={`text-xs md:text-sm font-bold ${rarity?.text} text-center px-2 line-clamp-1`}>
                                    {artifact?.name}
                                 </div>
                                 <div className="text-[10px] text-white/40 mt-1 uppercase tracking-widest hidden md:block">
                                    {artifact?.rarity}
                                 </div>
                               </>
                           )}
                           
                           {/* Remove Button */}
                           <div className="absolute top-1 right-1">
                              <XCircle size={14} className="text-white/30 hover:text-white" />
                           </div>
                        </>
                      ) : (
                        <div className="text-white/20 text-xs font-mono uppercase tracking-widest">Empty</div>
                      )}
                   </div>
                 );
              })}
           </div>
        </section>

        {/* 3. Drafting Options */}
        <section className="space-y-4">
           <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">Available Requisitions</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* OPTION A: MYSTERY BOX */}
              <button 
                 onClick={handleSelectMystery}
                 disabled={selectedIds.length >= MAX_SLOTS}
                 className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/30 bg-indigo-900/10 hover:bg-indigo-900/20 active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300">
                        <HelpCircle size={24} />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-indigo-100 group-hover:text-white">Random Signal</div>
                        <div className="text-[10px] text-indigo-300/60 uppercase tracking-wider">Unknown Artifact</div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="font-mono font-bold text-indigo-300">{MYSTERY_COST} ✦</span>
                 </div>
              </button>

              {/* OPTION B: SHOP ITEMS (3 Random) */}
              {shopOptions.map((artifact) => {
                 const isSelected = selectedIds.includes(artifact.id);
                 const styles = RARITY_STYLES[artifact.rarity];
                 const isDisabled = !isSelected && selectedIds.length >= MAX_SLOTS;

                 return (
                   <motion.div
                     key={artifact.id}
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     // [FIXED] Uses correct function name here
                     onClick={() => !isDisabled && handleSelectOption(artifact.id)}
                     className={`
                        relative p-4 rounded-xl border transition-all duration-200 group
                        ${isSelected 
                           ? `${styles.bg} ${styles.border} ${styles.glow} ring-1 ring-inset ring-white/10` 
                           : `bg-slate-900/40 border-white/5 hover:border-white/10 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/60'}`
                        }
                     `}
                   >
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <div className={`text-sm font-bold ${styles.text} flex items-center gap-2`}>
                               {artifact.name}
                               {artifact.type === 'Active' && <Zap size={12} className="text-yellow-400" />}
                               {artifact.type === 'Cursed' && <Skull size={12} className="text-rose-500" />}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                               {artifact.rarity} • {artifact.type}
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <div className={`text-sm font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                               {artifact.cost} <span className="text-[10px]">✦</span>
                            </div>
                         </div>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                         {artifact.description}
                      </p>

                      {isSelected && (
                         <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                         </div>
                      )}
                   </motion.div>
                 );
              })}
           </div>
        </section>
      </div>

      {/* 4. Footer Launch Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#020408]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Cost</span>
               <div className={`text-xl font-mono font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>
                  {totalCost} <span className="text-sm text-rose-500">✦</span>
               </div>
            </div>

            <Button 
               variant={canAfford ? "primary" : "secondary"}
               className={`flex-1 h-12 text-base ${!canAfford && 'opacity-50'}`}
               onClick={handleLaunch}
               disabled={!canAfford}
            >
               {canAfford ? (
                  <div className="flex items-center gap-2">
                     <RocketIcon />
                     <span>Initialize Sequence</span>
                  </div>
               ) : (
                  <span>Insufficient Shards</span>
               )}
            </Button>
         </div>
      </div>

    </main>
  );
}

// Simple Icon Component
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);