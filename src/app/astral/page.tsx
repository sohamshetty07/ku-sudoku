"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useGalaxyStore, SOLAR_SYSTEM, type CelestialNode } from "@/lib/store/galaxy";
import { useStore } from "@/lib/store"; 
import { 
  ArrowLeft, Plus, Minus, Lock, Star, Sparkles, Navigation, 
  Info, ShieldAlert, Cpu, CheckCircle, Orbit 
} from "lucide-react";
import Button from "@/components/ui/Button";
import { playSfx } from "@/lib/audio";

// --- CONSTANTS ---
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 6;
const INITIAL_ZOOM = 0.5;
const TIME_SCALE = 10.0; 

// --- PROCEDURAL TEXTURES ---
const getPlanetStyle = (node: CelestialNode) => {
  if (node.type === 'Star') {
    return {
      background: `radial-gradient(circle at 40% 40%, #fff7ed, #fcd34d 30%, #f59e0b 60%, #b45309)`,
      boxShadow: `0 0 60px ${node.color}, 0 0 120px ${node.color}40`,
    };
  }
  if (node.id === 'jupiter') {
    return {
      background: `linear-gradient(15deg, #78350f, #d97706 20%, #fcd34d 25%, #92400e 40%, #b45309 45%, #fff7ed 48%, #92400e 60%, #78350f)`,
      boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.8)`,
      transform: 'rotate(-20deg)', 
    };
  }
  if (node.id === 'saturn') {
    return {
      background: `linear-gradient(15deg, #ca8a04, #fde047 30%, #eab308 50%, #a16207 80%)`,
      boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.7)`,
      transform: 'rotate(-20deg)',
    };
  }
  if (node.id === 'earth') {
    return {
      background: `radial-gradient(circle at 45% 45%, #4ade80 0%, #3b82f6 30%, #1d4ed8 70%, #1e3a8a 100%)`,
      boxShadow: `inset -6px -6px 15px rgba(0,0,0,0.9), 0 0 15px rgba(59,130,246,0.3)`,
    };
  }
  // Generic Spheres
  return {
    background: `radial-gradient(circle at 30% 30%, ${node.color}, #000 90%)`,
    boxShadow: `inset -4px -4px 12px rgba(0,0,0,0.9), 0 0 5px ${node.color}20`,
  };
};

export default function AstralChartPage() {
  const { 
    historyStars, 
    unlockNode, 
    isNodeUnlocked, 
    isNodeUnlockable, 
    unlockedNodeIds 
  } = useGalaxyStore();
  
  const { stardust, cometShards, addCurrency, pushSync } = useStore();

  const [camera, setCamera] = useState({ x: 0, y: 0, z: INITIAL_ZOOM });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<CelestialNode | null>(null);
  
  const [mounted, setMounted] = useState(false);
  const [simTime, setSimTime] = useState(0); 
  const [typedLore, setTypedLore] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- "FOG OF WAR" LOGIC ---
  const visibleNodes = useMemo(() => {
    const mainBodies = SOLAR_SYSTEM.filter(n => n.type === 'Star' || n.type === 'Planet');
    let maxUnlockedIndex = 0; 
    for (let i = 0; i < mainBodies.length; i++) {
        if (unlockedNodeIds.includes(mainBodies[i].id)) {
            maxUnlockedIndex = i;
        }
    }
    const visibleCutoffIndex = maxUnlockedIndex + 3;
    const visibleMainIds = mainBodies
        .filter((_, idx) => idx <= visibleCutoffIndex)
        .map(n => n.id);

    return SOLAR_SYSTEM.filter(node => {
        if (node.type === 'Star' || node.type === 'Planet') {
            return visibleMainIds.includes(node.id);
        }
        if (node.type === 'Moon' && node.parentId) {
            return visibleMainIds.includes(node.parentId);
        }
        return false;
    });
  }, [unlockedNodeIds]); 

  // --- ANIMATION LOOP ---
  useEffect(() => {
    setMounted(true);
    let frameId: number;
    const loop = () => {
      setSimTime(Date.now() / 1000); 
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // --- TYPEWRITER ---
  const isCurrentUnlocked = selectedNode ? unlockedNodeIds.includes(selectedNode.id) : false;
  useEffect(() => {
    if (selectedNode && isCurrentUnlocked) {
        let i = 0;
        const text = selectedNode.description;
        setTypedLore(""); 
        const interval = setInterval(() => {
            setTypedLore(text.substring(0, i + 1));
            i++;
            if (i === text.length) clearInterval(interval);
        }, 30); 
        return () => clearInterval(interval);
    } else {
        setTypedLore("");
    }
  }, [selectedNode, isCurrentUnlocked]);

  // --- PHYSICS ENGINE ---
  const getNodePosition = useCallback((node: CelestialNode): { x: number, y: number } => {
    if (!mounted) return { x: node.x, y: node.y }; 
    if (!node.parentId && !node.orbitRadius) return { x: 0, y: 0 }; 
    
    let parentX = 0, parentY = 0;
    if (node.parentId) {
       const parent = SOLAR_SYSTEM.find(n => n.id === node.parentId);
       if (parent) {
           const pPos = getNodePosition(parent);
           parentX = pPos.x;
           parentY = pPos.y;
       }
    }

    const speed = node.orbitSpeed || 0;
    const angle = (node.startAngle || 0) + (simTime * speed * TIME_SCALE); 
    
    const x = parentX + Math.cos(angle) * (node.orbitRadius || 0);
    const y = parentY + Math.sin(angle) * (node.orbitRadius || 0);

    return { x, y };
  }, [simTime, mounted]);

  // --- BACKGROUND ---
  const drawStarfield = useCallback(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== window.innerWidth * dpr || canvas.height !== window.innerHeight * dpr) {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    historyStars.forEach(star => {
      const screenX = cx + (star.x + camera.x) * camera.z;
      const screenY = cy + (star.y + camera.y) * camera.z;
      if (screenX < -10 || screenX > window.innerWidth + 10 || screenY < -10 || screenY > window.innerHeight + 10) return;

      const size = star.size * camera.z;
      const alpha = Math.max(0, Math.min(star.opacity, 1.2 - (camera.z * 0.2))); 
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [camera, historyStars, mounted]);

  useEffect(() => {
    drawStarfield();
    window.addEventListener('resize', drawStarfield);
    return () => window.removeEventListener('resize', drawStarfield);
  }, [drawStarfield]); 

  // --- INTERACTION ---
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - camera.x * camera.z, y: clientY - camera.y * camera.z });
  };
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const newX = (clientX - dragStart.x) / camera.z;
    const newY = (clientY - dragStart.y) / camera.z;
    setCamera(prev => ({ ...prev, x: newX, y: newY }));
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleZoom = (delta: number) => setCamera(prev => ({...prev, z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.z + delta))}));
  const centerCamera = () => setCamera({ x: 0, y: 0, z: 1 });

  // --- UNLOCKING ---
  const handleUnlockAttempt = () => {
    if (!selectedNode) return;
    const canAfford = selectedNode.currency === 'stardust' ? stardust >= selectedNode.cost : cometShards >= selectedNode.cost;
    if (!canAfford) { playSfx('error'); return; }
    
    playSfx('heavy-impact'); 
    addCurrency(selectedNode.currency, -selectedNode.cost);
    unlockNode(selectedNode.id);
    
    // Trigger Cloud Sync immediately
    pushSync();
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden overscroll-none touch-none select-none">
      
      {/* 1. BACKGROUND */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 2. INTERACTIVE LAYER */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-10 cursor-move active:cursor-grabbing"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
      >
        <div className="absolute top-1/2 left-1/2 w-0 h-0 will-change-transform" style={{ transform: `scale(${camera.z}) translate(${camera.x}px, ${camera.y}px)` }}>
          
          {mounted && visibleNodes.map(node => {
             const pos = getNodePosition(node);
             const parentPos = node.parentId ? getNodePosition(SOLAR_SYSTEM.find(n => n.id === node.parentId)!) : { x: 0, y: 0 };
             const unlocked = unlockedNodeIds.includes(node.id);
             const unlockable = isNodeUnlockable(node.id);
             
             const scale = node.type === 'Star' ? 2.5 : node.type === 'Moon' ? 0.6 : 1.2;
             const showLabel = node.type === 'Moon' ? (camera.z > 2 && unlocked) : (camera.z > 0.4 || !unlocked); 
             const customStyle = getPlanetStyle(node);

             return (
               <React.Fragment key={node.id}>
                   
                   {/* ORBIT LINE */}
                   {node.parentId && node.orbitRadius && (
                     <div className="absolute pointer-events-none" 
                          style={{
                              left: parentPos.x - node.orbitRadius,
                              top: parentPos.y - node.orbitRadius,
                              width: node.orbitRadius * 2,
                              height: node.orbitRadius * 2,
                              border: `1px dashed rgba(255,255,255, ${unlocked ? 0.15 : 0.05})`,
                              borderRadius: '50%',
                              transition: 'none'
                          }} 
                     />
                   )}

                   {/* PLANET BODY */}
                   <button
                     onClick={(e) => { e.stopPropagation(); setSelectedNode(node); playSfx('click'); }}
                     className={`
                        absolute flex items-center justify-center rounded-full
                        ${unlocked ? 'hover:scale-110 hover:z-50' : ''}
                        ${!unlocked ? 'grayscale-[1] brightness-[0.4] opacity-80 cursor-not-allowed' : 'cursor-pointer'}
                        ${!unlocked && unlockable ? 'cursor-pointer hover:brightness-75 hover:scale-105' : ''}
                     `}
                     style={{
                        left: pos.x,
                        top: pos.y,
                        width: node.radius * 2 * scale,
                        height: node.radius * 2 * scale,
                        marginLeft: -(node.radius * scale), 
                        marginTop: -(node.radius * scale), 
                        zIndex: node.type === 'Star' ? 20 : 30,
                        transition: 'opacity 1s ease-out, transform 0.2s',
                        ...customStyle
                     }}
                   >
                     {/* LOCK ICON OVERLAY */}
                     {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={node.radius < 10 ? 8 : 12} className="text-white/40 drop-shadow-md" />
                        </div>
                     )}

                     {/* LABEL */}
                     <div className={`absolute top-full mt-3 whitespace-nowrap transition-all duration-300 pointer-events-none ${showLabel ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                         <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-full backdrop-blur-md border shadow-lg ${unlocked ? 'bg-slate-900/60 text-white border-white/20' : 'bg-black/60 text-white/30 border-white/5'}`}>
                             {node.name}
                         </span>
                     </div>
                   </button>
               </React.Fragment>
             );
          })}
        </div>
      </div>

      {/* 3. HUD */}
      <div className="absolute top-0 left-0 w-full p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-start pointer-events-none z-50">
          <Link href="/dashboard" className="pointer-events-auto p-3 rounded-full bg-midnight/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 shadow-lg"><ArrowLeft size={24} /></Link>
          <div className="flex flex-col items-end gap-2">
               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-midnight/80 backdrop-blur-md border border-neon-amber/20 shadow-lg animate-fade-in"><Star size={14} className="text-neon-amber fill-neon-amber" /><span className="font-mono font-bold text-amber-100">{stardust}</span></div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-midnight/80 backdrop-blur-md border border-neon-red/20 shadow-lg animate-fade-in delay-100"><Sparkles size={14} className="text-neon-red fill-neon-red" /><span className="font-mono font-bold text-red-100">{cometShards}</span></div>
          </div>
      </div>
      <div className="absolute bottom-8 right-4 flex flex-col gap-2 z-50 pb-[env(safe-area-inset-bottom)]">
          <button onClick={centerCamera} className="p-3 rounded-full bg-midnight/80 border border-white/10 text-white hover:bg-white/20 active:scale-95 shadow-xl"><Navigation size={20} /></button>
          <div className="flex flex-col rounded-full bg-midnight/80 border border-white/10 overflow-hidden shadow-xl">
             <button onClick={() => handleZoom(0.5)} className="p-3 hover:bg-white/20 active:scale-95 border-b border-white/10 text-white"><Plus size={20} /></button>
             <button onClick={() => handleZoom(-0.5)} className="p-3 hover:bg-white/20 active:scale-95 text-white"><Minus size={20} /></button>
          </div>
      </div>

      {/* 4. MODAL */}
      {selectedNode && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="w-full max-w-sm bg-midnight/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-500">
               
               {/* Ambient Glow */}
               <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-[80px] pointer-events-none" style={{ backgroundColor: selectedNode.color }} />

               {/* Header */}
               <div className="flex justify-between items-start mb-6">
                   <div>
                       <h2 className="text-3xl font-mono font-bold tracking-widest uppercase flex items-center gap-3" style={{ color: selectedNode.color }}>{selectedNode.name}</h2>
                       <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded">{selectedNode.type}</span>
                            {!isCurrentUnlocked && (
                                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-neon-red bg-red-500/10 px-2 py-1 rounded border border-red-500/20"><Lock size={10} /> Locked</span>
                            )}
                       </div>
                   </div>
                   {/* Preview Icon */}
                   <div 
                      className={`w-12 h-12 shadow-2xl transition-all duration-1000 ${isCurrentUnlocked ? 'rounded-full' : 'rounded-full opacity-50 grayscale'}`} 
                      style={getPlanetStyle(selectedNode)} 
                   />
               </div>

               {/* Info Box */}
               <div className="relative p-5 rounded-xl bg-slate-900/50 border border-white/5 mb-6 min-h-[120px]">
                    {isCurrentUnlocked || selectedNode.id === 'sun' ? (
                        <>
                            <Info size={16} className="absolute top-5 left-4 text-slate-500" />
                            <div className="pl-6 space-y-4">
                                <p className="text-slate-300 text-sm leading-relaxed font-mono">
                                    {typedLore} 
                                    <span className="animate-pulse text-neon-cyan">_</span>
                                </p>
                                
                                {/* REWARD */}
                                <div className="pt-2 border-t border-white/5 animate-slide-up">
                                    <div className="flex items-center gap-2 text-xs font-bold text-neon-cyan uppercase tracking-widest mb-1">
                                        <CheckCircle size={12} /> Beacon Active
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {selectedNode.perk || "Passive: Universe Connection"}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 py-4">
                            <ShieldAlert size={24} className="opacity-50" />
                            <p className="text-xs uppercase tracking-widest font-bold">Signal Encrypted</p>
                            <p className="text-[10px] opacity-60 text-center">Data node inactive.<br/>Ignite core to establish link.</p>
                        </div>
                    )}
               </div>

               {/* Action Area */}
               <div className="space-y-3">
                   {isCurrentUnlocked ? (
                        <Button 
                            fullWidth 
                            variant="secondary" 
                            onClick={() => setSelectedNode(null)}
                        >
                            Close Uplink
                        </Button>
                   ) : isNodeUnlockable(selectedNode.id) ? (
                       <Button 
                         fullWidth 
                         variant="primary" 
                         onClick={handleUnlockAttempt}
                         className={selectedNode.currency === 'stardust' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500'}
                       >
                           <div className="flex items-center justify-center gap-2">
                               <Cpu size={16} />
                               <span>Initialize Core</span>
                               <span className="font-mono bg-black/20 px-2 rounded">{selectedNode.cost} {selectedNode.currency === 'stardust' ? '★' : '✦'}</span>
                           </div>
                       </Button>
                   ) : (
                       <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                           <p className="text-xs text-neon-red/60 uppercase tracking-widest font-bold">Orbit Unreachable</p>
                           <p className="text-[10px] text-slate-500 mt-1">Link previous node first</p>
                       </div>
                   )}
                   
                   {!isCurrentUnlocked && (
                        <button 
                            onClick={() => setSelectedNode(null)} 
                            className="w-full text-center text-xs text-slate-500 hover:text-white py-2"
                        >
                            Return to Chart
                        </button>
                   )}
               </div>
           </div>
        </div>
      )}

    </main>
  );
}