"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { ARTIFACTS, type Artifact } from "@/lib/progression/constants";
import { playSfx } from "@/lib/audio";
import Button from "@/components/ui/Button";
import { 
  ArrowRight, ShieldCheck, Gem, LogOut, RefreshCw, XCircle, CheckCircle, Hexagon
} from "lucide-react";

interface ExpeditionIntermissionModalProps {
  onContinue: () => void;
  onCashOut: () => void; // New Prop for leaving
  sector: number;
}

type Phase = 'DECISION' | 'MARKET';

export default function ExpeditionIntermissionModal({ 
  onContinue, 
  onCashOut,
  sector 
}: ExpeditionIntermissionModalProps) {
  const { expedition, updateExpedition, spendCurrency, addCurrency } = useStore();
  const [phase, setPhase] = useState<Phase>('DECISION');
  const [marketOptions, setMarketOptions] = useState<Artifact[]>([]);
  const [selectedMarketItem, setSelectedMarketItem] = useState<Artifact | null>(null);
  
  // Calculate Payout
  const payoutStardust = 100 + (sector * 50);
  const payoutShards = Math.floor(sector / 2) + 1;

  // Init Market on Mount
  useEffect(() => {
    // Shuffle all artifacts and pick 4 random ones for the market
    const shuffled = [...ARTIFACTS].sort(() => 0.5 - Math.random());
    setMarketOptions(shuffled.slice(0, 4));
  }, []);

  // --- HANDLERS ---

  const handleTakeArtifact = (newItem: Artifact) => {
    const currentArtifacts = expedition.artifacts;
    
    // Case 1: Empty Slot Available
    if (currentArtifacts.length < 3) {
        playSfx('upgrade');
        updateExpedition({
            artifacts: [...currentArtifacts, newItem.id]
        });
        // Auto continue after picking an item if space exists
        onContinue(); 
    } 
    // Case 2: Inventory Full - Needs Swap
    else {
        playSfx('click');
        setSelectedMarketItem(newItem);
    }
  };

  const handleSwap = (oldArtifactId: string) => {
    if (!selectedMarketItem) return;
    
    // Pay Cost
    const success = spendCurrency('stardust', 75);
    if (!success) {
        playSfx('error');
        // Simple alert for now, could be a toast
        alert("Not enough Stardust (75) to swap modules!");
        return;
    }

    playSfx('heavy-impact');
    
    // Replace old ID with new ID
    const newLoadout = expedition.artifacts.map(id => id === oldArtifactId ? selectedMarketItem.id : id);
    
    updateExpedition({ artifacts: newLoadout });
    onContinue();
  };

  const handleSkipMarket = () => {
      playSfx('click');
      onContinue();
  };

  // --- RENDER ---

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-[#050b14] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-indigo-900/20 p-6 border-b border-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-mono font-bold text-white uppercase tracking-widest">
                    Sector {sector} Cleared
                </h2>
                <p className="text-xs text-indigo-300 font-mono tracking-wider">VOID STATION DOCKING SEQUENCE COMPLETE</p>
            </div>
            <Hexagon className="text-indigo-500 animate-spin-slow" size={32} />
        </div>

        <div className="p-6 md:p-8">
            
            {/* PHASE 1: DECISION */}
            {phase === 'DECISION' && (
                <div className="space-y-8">
                    <p className="text-slate-400 text-center text-sm leading-relaxed max-w-lg mx-auto">
                        Your vessel has docked at a Void Station. Supplies have been replenished. 
                        Long-range scanners indicate increasing instability in the next sector. <br/><br/>
                        Secure your current data and retreat, or delve deeper into the void?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CASH OUT */}
                        <button 
                            onClick={() => { playSfx('success'); onCashOut(); }}
                            className="group p-6 rounded-2xl border border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/20 text-left transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-3 mb-4 text-emerald-400">
                                <LogOut size={24} />
                                <span className="font-bold text-lg uppercase tracking-wider">Extract</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-emerald-200/60 font-mono">
                                    <span>Stardust Payout</span>
                                    <span className="text-white font-bold">+{payoutStardust}</span>
                                </div>
                                <div className="flex justify-between text-sm text-emerald-200/60 font-mono">
                                    <span>Shard Payout</span>
                                    <span className="text-white font-bold">+{payoutShards}</span>
                                </div>
                            </div>
                        </button>

                        {/* CONTINUE */}
                        <button 
                            onClick={() => { playSfx('click'); setPhase('MARKET'); }}
                            className="group p-6 rounded-2xl border border-indigo-500/30 bg-indigo-900/10 hover:bg-indigo-900/20 text-left transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-3 mb-4 text-indigo-400">
                                <ArrowRight size={24} />
                                <span className="font-bold text-lg uppercase tracking-wider">Continue</span>
                            </div>
                            <p className="text-xs text-indigo-300/60 mb-2">
                                Enter the Void Market to refit your vessel with new artifacts.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                                Next: Sector {sector + 1}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE 2: MARKET */}
            {phase === 'MARKET' && !selectedMarketItem && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Void Market</h3>
                        <button onClick={handleSkipMarket} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                            Skip Refit <ArrowRight size={12}/>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {marketOptions.map(art => (
                            <button 
                                key={art.id}
                                onClick={() => handleTakeArtifact(art)}
                                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all flex flex-col gap-2 group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-indigo-300 text-sm group-hover:text-indigo-200">{art.name}</span>
                                    {expedition.artifacts.length >= 3 && <RefreshCw size={12} className="text-slate-500 group-hover:text-amber-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-snug">{art.description}</p>
                                <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mt-auto pt-2">
                                    {art.rarity} • {art.type}
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    {expedition.artifacts.length >= 3 && (
                        <p className="text-center text-[10px] text-slate-500 bg-black/20 py-2 rounded-lg border border-white/5">
                            Inventory Full. Selecting an item will require swapping (Cost: <span className="text-amber-400 font-bold">75 Stardust</span>).
                        </p>
                    )}
                </div>
            )}

            {/* PHASE 3: SWAP CONFIRMATION */}
            {selectedMarketItem && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-1">Systems At Capacity</h3>
                        <p className="text-xs text-slate-400">
                            Choose a module to discard to install <span className="text-indigo-400 font-bold">{selectedMarketItem.name}</span>.
                            <br/> <span className="text-amber-500 font-bold mt-1 block">Cost: 75 Stardust</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {expedition.artifacts.map(id => {
                            const art = ARTIFACTS.find(a => a.id === id);
                            if (!art) return null;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleSwap(id)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/50 text-slate-300 hover:text-red-200 transition-all group"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold">{art.name}</span>
                                        <span className="text-[10px] opacity-60">{art.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Discard <XCircle size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <Button variant="secondary" fullWidth onClick={() => setSelectedMarketItem(null)}>
                        Cancel Swap
                    </Button>
                </div>
            )}

        </div>
      </motion.div>
    </div>
  );
}