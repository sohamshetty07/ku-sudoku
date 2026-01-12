"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ARTIFACTS } from "@/lib/progression/constants";
import { 
  X, Hexagon, Shield, Zap, Skull, TrendingUp, 
  LogOut, Play, HelpCircle, AlertTriangle 
} from "lucide-react";
import { playSfx } from "@/lib/audio";

interface ExpeditionGuideModalProps {
  onClose: () => void;
}

type Tab = 'PROTOCOL' | 'ARMORY';
type RarityFilter = 'ALL' | 'Common' | 'Rare' | 'Legendary' | 'Cursed';

export default function ExpeditionGuideModal({ onClose }: ExpeditionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('PROTOCOL');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');

  const handleTabChange = (tab: Tab) => {
      playSfx('click');
      setActiveTab(tab);
  };

  const filteredArtifacts = ARTIFACTS.filter(a => 
      rarityFilter === 'ALL' ? true : a.rarity === rarityFilter
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-[#0F172A] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[800px]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col shrink-0">
            <div className="mb-8">
                <h2 className="text-xl font-mono font-bold text-white tracking-widest uppercase leading-none">
                    Mission<br/>Briefing
                </h2>
                <p className="text-[10px] text-indigo-400 font-mono mt-2 tracking-wider">CLASSIFIED: VOID CLEARANCE</p>
            </div>

            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
                <NavButton 
                    active={activeTab === 'PROTOCOL'} 
                    onClick={() => handleTabChange('PROTOCOL')} 
                    icon={Hexagon} 
                    label="Core Protocol" 
                />
                <NavButton 
                    active={activeTab === 'ARMORY'} 
                    onClick={() => handleTabChange('ARMORY')} 
                    icon={Shield} 
                    label="Artifact Armory" 
                />
            </nav>

            <div className="mt-auto pt-6 hidden md:block">
                <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                    <p className="text-xs text-indigo-200 leading-relaxed">
                        <span className="font-bold text-indigo-100 block mb-1">Tip:</span> 
                        Use <span className="text-amber-400">Active Artifacts</span> wisely. They have limited charges per sector.
                    </p>
                </div>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col relative h-full bg-[#0F172A] overflow-hidden">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 text-white/40 hover:text-white transition-colors bg-black/40 rounded-full hover:bg-white/10"
            >
                <X size={20} />
            </button>

            {/* Scrollable Container - Removed Padding here to allow Sticky Header to touch edges */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    
                    {/* --- TAB 1: PROTOCOL --- */}
                    {activeTab === 'PROTOCOL' && (
                        <motion.div 
                            key="protocol"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            // Added padding here instead
                            className="p-6 md:p-8 space-y-8 pb-12"
                        >
                            <Header title="Mission Objectives" subtitle="Survival is the only metric." />
                            
                            <div className="grid grid-cols-1 gap-4">
                                <InfoCard 
                                    icon={Play}
                                    color="text-emerald-400"
                                    title="Endurance Run"
                                    desc="Clear consecutive Sudoku sectors. Difficulty increases with every jump. Your Lives do NOT reset between sectors."
                                />
                                <InfoCard 
                                    icon={LogOut}
                                    color="text-amber-400"
                                    title="Risk & Extraction"
                                    desc="After each sector, choose to EXTRACT (Keep earnings) or CONTINUE (Risk it all for higher multipliers). Losing a sector means losing everything."
                                />
                                <InfoCard 
                                    icon={TrendingUp}
                                    color="text-cyan-400"
                                    title="Scaling Rewards"
                                    desc="Deep sectors yield massive XP and Stardust. Completing challenges earns you more Comet Shards for the Elite Shop."
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB 2: ARMORY (CATALOG) --- */}
                    {activeTab === 'ARMORY' && (
                        <motion.div 
                            key="armory"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="relative min-h-full"
                        >
                             {/* [FIXED] Sticky Header - Now sticks perfectly to the top 0 because parent has no padding */}
                             <div className="sticky top-0 bg-[#0F172A] z-10 px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-white/5 shadow-xl shadow-[#0F172A]/50 flex flex-col gap-4">
                                <Header title="Artifact Database" subtitle="Authorized Tech & Anomalies." />
                                
                                {/* Filters */}
                                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg overflow-x-auto no-scrollbar">
                                    {(['ALL', 'Common', 'Rare', 'Legendary', 'Cursed'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setRarityFilter(f)}
                                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap
                                                ${rarityFilter === f 
                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-300'
                                                }
                                            `}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             {/* Artifact Grid */}
                             <div className="px-6 md:px-8 pb-12 pt-6 space-y-6">
                                
                                {/* Mystery Signal Card (Always visible or filtered if you prefer) */}
                                {rarityFilter === 'ALL' && (
                                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-300">
                                            <HelpCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">The Mystery Signal</h4>
                                            <p className="text-xs text-slate-400 leading-snug mt-1">
                                                Available during draft. Costs only <strong>2 Shards</strong> but grants a random artifact from any tier.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredArtifacts.map(art => (
                                        <div key={art.id} className="p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {art.type === 'Cursed' ? <Skull size={14} className="text-rose-500"/> : 
                                                    art.type === 'Active' ? <Zap size={14} className="text-amber-400"/> : 
                                                    <Shield size={14} className="text-indigo-400"/>}
                                                    <span className={`text-sm font-bold ${getRarityColor(art.rarity)}`}>{art.name}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500">{art.cost} ✦</span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-snug">{art.description}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">{art.rarity}</span>
                                                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">{art.type}</span>
                                                </div>
                                                {art.type === 'Cursed' && (
                                                    <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={10} /> High Risk
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- HELPERS ---

const getRarityColor = (rarity: string) => {
    switch(rarity) {
        case 'Common': return 'text-slate-300';
        case 'Rare': return 'text-cyan-400';
        case 'Legendary': return 'text-amber-400';
        case 'Cursed': return 'text-rose-500';
        default: return 'text-white';
    }
};

// --- SUBCOMPONENTS ---

function NavButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left
                ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
        >
            <Icon size={18} />
            <span className="text-sm font-bold tracking-wide whitespace-nowrap">{label}</span>
        </button>
    );
}

function Header({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
    );
}

function InfoCard({ icon: Icon, color, title, desc }: any) {
    return (
        <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className={`mt-1 ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}