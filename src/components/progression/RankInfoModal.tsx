"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Lock, Check, Trophy, Star, Sparkles, Zap } from "lucide-react";
import { RANKS } from "@/lib/progression/constants";

interface RankInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
}

export default function RankInfoModal({ isOpen, onClose, currentXp }: RankInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'ranks' | 'resources'>('ranks');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* HEADER & TABS */}
        <div className="bg-white/5 border-b border-white/10">
          <div className="flex justify-between items-center p-4 pb-2">
             <h2 className="text-lg font-bold text-white tracking-wide">Constellation Guide</h2>
             <button onClick={onClose} className="text-white/50 hover:text-white">
               <X size={20} />
             </button>
          </div>
          
          <div className="flex px-4 gap-4">
            <button 
              onClick={() => setActiveTab('ranks')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ranks' ? 'text-neon-cyan border-neon-cyan' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              Path of Logic
            </button>
            <button 
              onClick={() => setActiveTab('resources')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'resources' ? 'text-neon-cyan border-neon-cyan' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              Resources
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: RANKS */}
          {activeTab === 'ranks' && (
            <div className="space-y-3">
              {RANKS.map((rank) => {
                const isUnlocked = currentXp >= rank.minXp;
                return (
                  <div key={rank.id} className={`relative p-3 rounded-xl border flex items-center gap-3 ${isUnlocked ? "bg-white/5 border-neon-cyan/30" : "bg-transparent border-white/5 opacity-50"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-white/30"}`}>
                      {isUnlocked ? <Check size={14} /> : <Lock size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold text-sm ${isUnlocked ? "text-white" : "text-white/50"}`}>{rank.title}</span>
                        <span className="text-[10px] font-mono text-white/40">{rank.minXp} XP</span>
                      </div>
                      <p className="text-xs text-white/60">{rank.benefit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: RESOURCES (EXPLANATION) */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              
              {/* ELO */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-neon-cyan">
                  <Trophy size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Skill Rating (ELO)</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  A measure of your pure logic capability. It rises when you win Standard/Mastery games and falls when you lose.
                  <br/><span className="text-white/30 italic mt-1 block">Higher ELO = Harder Puzzles.</span>
                </p>
              </div>

              {/* XP */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <Zap size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Experience (XP)</span>
                </div>
                <p className="text-xs text-purple-200/60 leading-relaxed">
                  Earned by playing ANY game mode. Measures your dedication to the Void. XP never decreases.
                  <br/><span className="text-white/30 italic mt-1 block">Unlocks: New Game Modes & Ranks.</span>
                </p>
              </div>

              {/* STARDUST */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Star size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Stardust</span>
                </div>
                <p className="text-xs text-amber-200/60 leading-relaxed">
                  Common currency found in the Void. Earn bonus Stardust for <strong>Speed</strong> and <strong>Flawless</strong> victories.
                  <br/><span className="text-white/30 italic mt-1 block">Usage: Buying Standard Themes.</span>
                </p>
              </div>

              {/* SHARDS */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-500">
                  <Sparkles size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Comet Shards</span>
                </div>
                <p className="text-xs text-rose-200/60 leading-relaxed">
                  Rare matter found only in high-pressure environments.
                  <br/><span className="text-white/30 italic mt-1 block">How to get: Only available in <strong>Mastery Mode</strong> wins.</span>
                </p>
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}