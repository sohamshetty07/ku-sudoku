"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, Lock, Check, Trophy, Star, Sparkles, Zap, 
  BookOpen, Hexagon, MousePointerClick, Eraser, 
  Database, Shield, AlertTriangle, ChevronRight, LayoutGrid,
  Telescope, Globe, Flame, Calendar, Map, Orbit, BarChart3
} from "lucide-react";
import { RANKS } from "@/lib/progression/constants";

interface RankInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
  initialTab?: Tab;
}

type Tab = 'basics' | 'ranks' | 'economy' | 'galaxy' | 'expedition' | 'network';

export default function RankInfoModal({ isOpen, onClose, currentXp, initialTab = 'basics' }: RankInfoModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-5xl bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col md:flex-row"
      >
        
        {/* --- LEFT SIDEBAR (Navigation) --- */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto scrollbar-hide">
            <div className="hidden md:block mb-6 px-3 mt-2">
                <div className="flex items-center gap-2 text-neon-cyan mb-1">
                    <Database size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Database</span>
                </div>
                <h1 className="text-2xl font-bold text-white font-mono tracking-tight">ARCHIVES</h1>
            </div>

            <NavButton active={activeTab === 'basics'} onClick={() => setActiveTab('basics')} icon={<BookOpen size={18} />} label="Protocol (Basics)" />
            <NavButton active={activeTab === 'ranks'} onClick={() => setActiveTab('ranks')} icon={<Trophy size={18} />} label="Rank Progression" />
            <NavButton active={activeTab === 'economy'} onClick={() => setActiveTab('economy')} icon={<Star size={18} />} label="Void Economy" />
            <NavButton active={activeTab === 'galaxy'} onClick={() => setActiveTab('galaxy')} icon={<Telescope size={18} />} label="Astral Chart" />
            <NavButton active={activeTab === 'expedition'} onClick={() => setActiveTab('expedition')} icon={<Hexagon size={18} />} label="Expedition Mode" />
            <NavButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Globe size={18} />} label="Social Network" />

            <button onClick={onClose} className="md:hidden ml-auto p-2 text-white/50">
                <X size={24} />
            </button>
        </div>

        {/* --- RIGHT CONTENT AREA --- */}
        <div className="flex-1 relative flex flex-col bg-gradient-to-br from-[#0F172A] to-[#020617] overflow-hidden">
            <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 z-20 w-8 h-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X size={18} />
            </button>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

                {/* === TAB: BASICS === */}
                {activeTab === 'basics' && (
                    <div className="space-y-8 animate-fade-in">
                        <Header title="Standard Protocol" subtitle="Core Mechanics" />
                        
                        <Section title="Input Methods">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoCard icon={<LayoutGrid className="text-cyan-400" />} title="Cell-First (Default)" desc="1. Tap a Grid Cell first. 2. Tap a Number to fill it." />
                                <InfoCard icon={<MousePointerClick className="text-purple-400" />} title="Digit-First" desc="1. Select a Number (1-9) first. 2. Tap empty cells to rapid-fill." note="Toggle in Settings." />
                            </div>
                        </Section>

                        <Section title="Safety Systems">
                            <div className="space-y-3">
                                <FeatureRow icon={<Eraser size={20} className="text-rose-400" />} title="Mistake Limit" desc="3 Errors will lock the system (Game Over). Use Notes to be safe." />
                                <FeatureRow icon={<Zap size={20} className="text-amber-400" />} title="Smart Notes" desc="Notes auto-update. If you place a '5', all '5' notes in that row/col/box are removed." />
                                <FeatureRow icon={<Flame size={20} className="text-orange-500" />} title="Daily Streak" desc="Play at least one game every 24 hours to keep your Streak Flame alive on the Dashboard." />
                            </div>
                        </Section>
                    </div>
                )}

                {/* === TAB: RANKS === */}
                {activeTab === 'ranks' && (
                    <div className="space-y-6 animate-fade-in">
                        <Header title="Clearance Levels" subtitle="XP Progression" />
                        <div className="flex items-center justify-between bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 mb-6">
                            <div>
                                <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Current XP</div>
                                <div className="text-2xl font-mono font-bold text-white">{currentXp.toLocaleString()}</div>
                            </div>
                            <Trophy size={32} className="text-indigo-400 opacity-50" />
                        </div>
                        <div className="space-y-3">
                            {RANKS.map((rank) => {
                                const isUnlocked = currentXp >= rank.minXp;
                                return (
                                <div key={rank.id} className={`relative p-4 rounded-xl border flex items-start gap-4 transition-all ${isUnlocked ? "bg-white/5 border-neon-cyan/30" : "bg-transparent border-white/5 opacity-50 grayscale"}`}>
                                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? "bg-neon-cyan text-midnight" : "bg-white/10 text-white/30"}`}>
                                        {isUnlocked ? <Check size={14} strokeWidth={3} /> : <Lock size={12} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold text-base ${isUnlocked ? "text-white" : "text-white/50"}`}>{rank.title}</span>
                                            <span className="text-xs font-mono text-neon-cyan/80">{rank.minXp.toLocaleString()} XP</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-snug">{rank.benefit}</p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === TAB: ECONOMY === */}
                {activeTab === 'economy' && (
                    <div className="space-y-8 animate-fade-in">
                         <Header title="Void Economy" subtitle="Resource Management" />
                         <div className="grid grid-cols-1 gap-6">
                            {/* STARDUST */}
                            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Star size={64} /></div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Star className="text-amber-400 fill-amber-400" size={24} />
                                    <h3 className="text-lg font-bold text-white">Stardust</h3>
                                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Common</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2 text-xs text-slate-300"><Check size={14} className="text-emerald-400"/> <span>Earned by completing <strong>any</strong> puzzle.</span></div>
                                    <div className="flex gap-2 text-xs text-slate-300"><Map size={14} className="text-cyan-400"/> <span>Used to unlock <strong>Planets</strong> in the Galaxy Map.</span></div>
                                    <div className="flex gap-2 text-xs text-slate-300"><Zap size={14} className="text-amber-400"/> <span>Used to buy <strong>Standard Themes</strong>.</span></div>
                                </div>
                            </div>

                            {/* SHARDS */}
                            <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={64} /></div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="text-rose-400 fill-rose-400" size={24} />
                                    <h3 className="text-lg font-bold text-white">Comet Shards</h3>
                                    <span className="text-[10px] uppercase font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded">Rare</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2 text-xs text-slate-300"><Check size={14} className="text-emerald-400"/> <span>Win on <strong>Mastery Difficulty</strong>.</span></div>
                                    <div className="flex gap-2 text-xs text-slate-300"><Check size={14} className="text-emerald-400"/> <span>Reach high sectors in <strong>Expedition</strong>.</span></div>
                                    <div className="flex gap-2 text-xs text-slate-300"><Zap size={14} className="text-rose-400"/> <span>Used for <strong>Artifacts</strong> & <strong>Premium Themes</strong> in the Observatory.</span></div>
                                </div>
                            </div>
                         </div>
                    </div>
                )}

                {/* === TAB: GALAXY (NEW) === */}
                {activeTab === 'galaxy' && (
                    <div className="space-y-8 animate-fade-in">
                        <Header title="Astral Chart" subtitle="The Known Universe" />
                        
                        

                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-2">
                            <div className="flex items-start gap-3">
                                <Telescope className="text-indigo-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-white">Fog of War</h4>
                                    <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                                        The universe is vast. You must unlock nodes (Planets & Stars) sequentially using Stardust to reveal more of the map.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Section title="Celestial Objects">
                            <div className="space-y-3">
                                <FeatureRow icon={<Orbit size={20} className="text-cyan-400" />} title="Planetary Buffs" desc="Unlocking a planet grants permanent passive buffs (e.g., 'Jupiter' grants +10% XP on all games)." />
                                <FeatureRow icon={<Star size={20} className="text-white" />} title="History Stars" desc="Every game you play creates a small star in the background of the galaxy view. Your history literally builds the universe." />
                            </div>
                        </Section>
                    </div>
                )}

                {/* === TAB: EXPEDITION === */}
                {activeTab === 'expedition' && (
                    <div className="space-y-8 animate-fade-in">
                        <Header title="Void Expedition" subtitle="Roguelike Survival" />

                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-purple-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-white">High Stakes Protocol</h4>
                                    <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">
                                        Survival mode. Lose all lives = Run Over. You keep currency, but lose progress & artifacts.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Step num="01" title="The Journey" desc="Start at Sector 1. Each Sector is a puzzle. Difficulty rises with every jump." />
                            <Step num="02" title="Artifacts" desc="Equip tech to break rules. 'Auto-Fill' reveals cells, 'Shields' block mistakes." />
                            <Step num="03" title="Void Market" desc="Spend Stardust between sectors to heal or buy artifacts." />
                        </div>
                    </div>
                )}

                {/* === TAB: NETWORK (NEW) === */}
                {activeTab === 'network' && (
                    <div className="space-y-8 animate-fade-in">
                        <Header title="Social Network" subtitle="Global Connectivity" />

                        <div className="grid grid-cols-1 gap-4">
                            <InfoCard 
                                icon={<Globe className="text-emerald-400" />}
                                title="The Apex (Leaderboard)"
                                desc="Compete globally. Rankings are based on ELO (Skill Rating). Top players earn the title of 'Void Walker'."
                            />
                            <InfoCard 
                                icon={<Calendar className="text-amber-400" />}
                                title="Daily Challenges"
                                desc="A unique puzzle generated once every 24 hours. Everyone plays the exact same board. Compete for the fastest time."
                            />
                            <InfoCard 
                                icon={<BarChart3 className="text-cyan-400" />}
                                title="Neural Statistics"
                                desc="Track your win rates, best times, and heatmap (focus analysis) in the Stats page."
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavButton({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group ${active ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
            <div className={`transition-colors ${active ? 'text-neon-cyan' : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</div>
            <span className="font-bold text-sm tracking-wide">{label}</span>
            {active && <ChevronRight size={14} className="ml-auto opacity-50 text-neon-cyan" />}
        </button>
    )
}

function Header({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div className="border-b border-white/10 pb-4">
            <h2 className="text-3xl font-bold text-white mb-1 font-mono tracking-tight">{title}</h2>
            <p className="text-xs text-neon-cyan uppercase tracking-widest font-bold">{subtitle}</p>
        </div>
    )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><div className="h-px w-4 bg-slate-600"></div> {title}</h3>
            {children}
        </div>
    )
}

function InfoCard({ icon, title, desc, note }: any) {
    return (
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="mb-3">{icon}</div>
            <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">{desc}</p>
            {note && <div className="text-[10px] text-slate-500 italic border-t border-white/5 pt-2">{note}</div>}
        </div>
    )
}

function FeatureRow({ icon, title, desc }: any) {
    return (
        <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="shrink-0 mt-1">{icon}</div>
            <div>
                <h4 className="font-bold text-slate-200 text-sm">{title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function Step({ num, title, desc }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 font-bold text-white/50 font-mono">{num}</div>
            <div>
                <h4 className="text-sm font-bold text-white">{title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}