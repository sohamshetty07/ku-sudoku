"use client";
import { useStore } from "@/lib/store";
// FIXED IMPORT: Point to the new store location
import { type Theme } from "@/lib/store/theme"; 
import { Lock, Check } from "lucide-react";
import Button from "@/components/ui/Button";

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
    addCurrency 
  } = useStore();

  const isUnlocked = unlockedThemes.includes(theme.id);
  const isActive = activeThemeId === theme.id;
  const canAfford = theme.currency === 'stardust' 
    ? stardust >= theme.cost 
    : cometShards >= theme.cost;

  const handleBuy = () => {
    if (!canAfford) return;
    
    // Deduct Cost
    addCurrency(theme.currency, -theme.cost);
    
    // Unlock
    unlockTheme(theme.id);
  };

  return (
    <div className={`
      relative group overflow-hidden rounded-2xl border transition-all duration-300
      ${isActive 
        ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
        : "border-white/10 bg-white/5 hover:border-white/20"
      }
    `}>
      {/* PREVIEW HEADER */}
      <div 
        className="h-24 w-full relative flex items-center justify-center overflow-hidden"
        style={{ background: theme.background }}
      >
        <div className={`
          text-4xl font-mono font-bold
          ${theme.numColor}
        `}>
          5
        </div>
        
        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-2 right-2 bg-neon-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check size={10} /> EQUIPPED
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-bold text-sm">{theme.name}</h3>
          <p className="text-xs text-white/50 line-clamp-2">{theme.description}</p>
        </div>

        {/* ACTIONS */}
        {isUnlocked ? (
          <Button 
            variant={isActive ? "secondary" : "primary"}
            fullWidth 
            onClick={() => setActiveTheme(theme.id)}
            disabled={isActive}
            className="text-xs h-9"
          >
            {isActive ? "Active" : "Equip"}
          </Button>
        ) : (
          <Button 
            variant="secondary"
            fullWidth 
            onClick={handleBuy}
            disabled={!canAfford}
            className={`text-xs h-9 ${!canAfford ? 'opacity-50' : ''}`}
          >
            {theme.cost === 0 ? "Free" : (
              <span className="flex items-center gap-1">
                Unlock {theme.cost} 
                <span className={theme.currency === 'stardust' ? "text-amber-400" : "text-rose-500"}>
                  {theme.currency === 'stardust' ? '★' : '✦'}
                </span>
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}