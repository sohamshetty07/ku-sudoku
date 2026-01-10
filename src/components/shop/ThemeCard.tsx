"use client";
import { useStore } from "@/lib/store";
import { type Theme } from "@/lib/store/theme"; 
import { Lock, Check, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { playSfx } from "@/lib/audio"; 

interface ThemeCardProps {
  theme: Theme;
}

export default function ThemeCard({ theme }: ThemeCardProps) {
  const { 
    activeThemeId, 
    unlockedThemes, 
    unlockTheme, 
    setActiveTheme, 
    stardust, 
    cometShards, 
    addCurrency,
    pushSync 
  } = useStore();

  const isUnlocked = unlockedThemes.includes(theme.id);
  const isActive = activeThemeId === theme.id;
  const canAfford = theme.currency === 'stardust' 
    ? stardust >= theme.cost 
    : cometShards >= theme.cost;

  const handleEquip = () => {
    if (isActive) return;
    playSfx('click');
    setActiveTheme(theme.id);
  };

  const handleBuy = async () => {
    if (!canAfford) {
      playSfx('error');
      return;
    }
    
    // 1. Audio Feedback
    playSfx('victory'); 

    // 2. Transaction Logic
    addCurrency(theme.currency, -theme.cost);
    unlockTheme(theme.id);
    
    // 3. Instant Gratification (Auto-Equip)
    setActiveTheme(theme.id);

    // 4. Persistence
    pushSync(); 
  };

  return (
    <div className={`
      relative group overflow-hidden rounded-2xl border transition-all duration-300
      ${isActive 
        ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_rgba(34,211,238,0.1)] ring-1 ring-neon-cyan/50" 
        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }
    `}>
      
      {/* PREVIEW HEADER */}
      <div 
        className="h-28 w-full relative flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105"
        style={{ background: theme.background }}
      >
        {/* Pseudo-Grid Lines (Visible even when locked, so user sees the style) */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} 
        />

        {/* THE NUMBER PREVIEW - HIDDEN WHEN LOCKED */}
        {isUnlocked ? (
          <div className={`
            relative z-10 text-5xl font-mono font-bold
            ${theme.numColor} drop-shadow-lg animate-in zoom-in duration-300
          `}>
            5
          </div>
        ) : (
          // LOCKED STATE OVERLAY
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
             <div className="p-3 rounded-full bg-black/40 border border-white/10 shadow-lg">
                <Lock className="text-white/60" size={20} />
             </div>
          </div>
        )}
        
        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-2 right-2 bg-neon-cyan text-[#0F172A] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-20">
            <Check size={10} strokeWidth={4} /> EQUIPPED
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-white font-bold text-sm tracking-wide">{theme.name}</h3>
            {theme.type !== 'Standard' && (
                <Sparkles size={12} className="text-rose-400 animate-pulse-slow" />
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[2.5em]">
            {theme.description}
          </p>
        </div>

        {/* ACTIONS */}
        {isUnlocked ? (
          <Button 
            variant={isActive ? "secondary" : "primary"}
            fullWidth 
            onClick={handleEquip}
            disabled={isActive}
            className={`
                text-xs h-9 transition-all
                ${isActive ? 'opacity-50 cursor-default' : 'hover:scale-105'}
            `}
          >
            {isActive ? "System Active" : "Equip Protocol"}
          </Button>
        ) : (
          <Button 
            variant="secondary"
            fullWidth 
            onClick={handleBuy}
            disabled={!canAfford}
            className={`
                text-xs h-9 relative overflow-hidden group/btn
                ${!canAfford ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-white/30'}
                ${theme.currency === 'stardust' ? 'hover:bg-amber-500/10' : 'hover:bg-rose-500/10'}
            `}
          >
             {/* Cost Display */}
            <span className="flex items-center gap-1.5">
               <span>Unlock</span>
               <span className="font-mono font-bold">{theme.cost}</span>
               {theme.currency === 'stardust' ? (
                 <span className="text-amber-400">★</span>
               ) : (
                 <span className="text-rose-400">✦</span>
               )}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}