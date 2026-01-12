"use client";
import React from "react";
import { ARTIFACTS } from "@/lib/progression/constants";
import { X, Zap, Hexagon, Skull, Shield } from "lucide-react";

export default function ArtifactInfoModal({ 
  artifactId, 
  onClose 
}: { 
  artifactId: string; 
  onClose: () => void; 
}) {
  const artifact = ARTIFACTS.find(a => a.id === artifactId);
  if (!artifact) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white">
            <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-full bg-opacity-20 ${
                artifact.type === 'Cursed' ? 'bg-red-500 text-red-500' : 
                artifact.type === 'Active' ? 'bg-amber-500 text-amber-500' : 'bg-indigo-500 text-indigo-500'
            }`}>
                {artifact.type === 'Cursed' ? <Skull size={32} /> : 
                 artifact.type === 'Active' ? <Zap size={32} /> : <Hexagon size={32} />}
            </div>

            <div>
                <h3 className="text-xl font-bold text-white">{artifact.name}</h3>
                <span className="text-xs font-mono uppercase tracking-widest opacity-60">{artifact.rarity} • {artifact.type}</span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
                {artifact.description}
            </p>
            
            <div className="w-full h-px bg-white/10" />

            <div className="text-xs text-white/40 italic">
                {artifact.cooldownType === 'PerPuzzle' ? 'Recharges every sector' : 'Permanent effect'}
            </div>
        </div>
      </div>
    </div>
  );
}