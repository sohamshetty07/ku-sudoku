"use client";
import React from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Crown, LockOpen, Star } from "lucide-react";
import { RANKS, Rank } from "@/lib/progression/constants";

interface LevelUpModalProps {
  newRankId: string; // The ID of the rank they just hit (e.g., 'seeker')
  onClose: () => void;
}

export default function LevelUpModal({ newRankId, onClose }: LevelUpModalProps) {
  // Find the full rank details from our constants
  const rank = RANKS.find((r) => r.id === newRankId);

  if (!rank) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      
      {/* Background Particles (Simple CSS Animation) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-cyan/20 blur-[100px] rounded-full animate-pulse" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-black border border-amber-500/50 rounded-2xl p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)]"
      >
        
        {/* ICON POP */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-6 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
        >
          <Crown size={48} className="text-amber-500" />
        </motion.div>

        {/* TEXT: LEVEL UP */}
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 tracking-widest mb-2 font-mono"
        >
          RANK UP!
        </motion.h2>

        {/* TEXT: NEW RANK NAME */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.6 }}
           className="text-white text-lg font-medium mb-8"
        >
           You are now a <span className={`font-bold ${rank.color}`}>{rank.title}</span>
        </motion.div>

        {/* UNLOCK BOX */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex items-center gap-4 text-left"
        >
          <div className="p-3 bg-neon-cyan/20 rounded-lg text-neon-cyan">
            <LockOpen size={20} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">New Privileges</div>
            <div className="text-white text-sm font-bold leading-tight">{rank.benefit}</div>
          </div>
        </motion.div>

        {/* ACTION */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
        >
            <Button variant="primary" fullWidth onClick={onClose} className="bg-amber-500 hover:bg-amber-600 border-none text-black font-bold">
            Claim Status
            </Button>
        </motion.div>

      </motion.div>
    </div>
  );
}