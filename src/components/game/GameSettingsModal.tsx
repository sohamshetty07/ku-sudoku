"use client";
import React from "react";
import { X, Volume2, VolumeX, Eye, EyeOff, Eraser, Type, MousePointerClick, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

type GameSettingsModalProps = {
  onClose: () => void;
};

export default function GameSettingsModal({ onClose }: GameSettingsModalProps) {
  const { 
    audioEnabled, toggleAudio,
    timerVisible, toggleTimer,
    autoEraseNotes, toggleAutoErase,
    inputMode, toggleInputMode,
    textSize, toggleTextSize,
    highlightCompletions, toggleHighlightCompletions,
  } = useStore();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-zoom-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
            <h2 className="text-lg font-bold font-mono tracking-widest text-white">SYSTEM SETTINGS</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            
            {/* Visuals */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visuals</h3>
                
                <ToggleRow 
                    icon={textSize === 'large' ? <Type size={18} /> : <Type size={14} />}
                    label="Large Text"
                    isActive={textSize === 'large'}
                    onToggle={toggleTextSize}
                    color="bg-orange-400"
                />
                 <ToggleRow 
                    icon={<Sparkles size={18} />}
                    label="Completion Flash"
                    isActive={highlightCompletions}
                    onToggle={toggleHighlightCompletions}
                    color="bg-fuchsia-400"
                />
                 <ToggleRow 
                    icon={timerVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    label="Show Timer"
                    isActive={timerVisible}
                    onToggle={toggleTimer}
                    color="bg-teal-400"
                />
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* Gameplay */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gameplay</h3>
                
                <ToggleRow 
                    icon={<MousePointerClick size={18} />}
                    label="Digit-First Input"
                    isActive={inputMode === 'digit-first'}
                    onToggle={toggleInputMode}
                    color="bg-emerald-400"
                />
                <ToggleRow 
                    icon={<Eraser size={18} />}
                    label="Auto-Erase Notes"
                    isActive={autoEraseNotes}
                    onToggle={toggleAutoErase}
                    color="bg-indigo-400"
                />
                <ToggleRow 
                    icon={audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    label="Sound Effects"
                    isActive={audioEnabled}
                    onToggle={toggleAudio}
                    color="bg-cyan-400"
                />
            </div>

        </div>
      </div>
    </div>
  );
}

// Mini Toggle Component
function ToggleRow({ icon, label, isActive, onToggle, color }: any) {
    return (
        <div onClick={onToggle} className="flex items-center justify-between group cursor-pointer select-none">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isActive ? `bg-slate-800 text-white` : 'bg-slate-800/50 text-slate-500'}`}>
                    {icon}
                </div>
                <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>{label}</span>
            </div>
            {/* Switch */}
             <div className={`
                relative w-10 h-6 rounded-full transition-colors duration-300
                ${isActive ? 'bg-slate-700' : 'bg-slate-800'} border border-white/5
            `}>
                <div className={`
                    absolute top-1 left-1 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300
                    ${isActive ? `translate-x-4 ${color}` : 'translate-x-0 bg-slate-500'}
                `} />
            </div>
        </div>
    )
}