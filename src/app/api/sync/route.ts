import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    // 1. FETCH
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = new User({ email: session.user.email });
    }

    // Ensure sub-documents exist for legacy users or new accounts
    if (!user.progression) user.progression = {};
    if (!user.stats) user.stats = {};
    if (!user.settings) user.settings = {};
    if (!user.galaxy) user.galaxy = { unlockedNodeIds: ['sun'], historyStars: [] };

    const p = user.progression;
    const s = user.stats;
    const set = user.settings;
    const g = user.galaxy;

    // --- CRITICAL FIX: THE SENIORITY RULE ---
    // We compare 'gamesPlayed' to decide which data source is authoritative.
    // If the incoming client has FEWER games than the server, it means 
    // it's a new device or an outdated session. We MUST NOT overwrite 
    // volatile stats (ELO, Currency) with the client's lower/default values.
    
    const clientGames = body.gamesPlayed || 0;
    const serverGames = s.gamesPlayed || 0;
    
    // Logic: If Client is "ahead" or equal, trust Client. If Server is "ahead", trust Server.
    const trustClient = clientGames >= serverGames;


    // --- 1. PROGRESSION (Smart Merge) ---
    
    // XP: Always take the highest value (Max Strategy) - XP never decreases.
    if ((body.xp || 0) > p.xp) p.xp = body.xp;

    // ELO & ECONOMY: Only update if we trust the client (Seniority Rule).
    // This prevents a fresh phone login (ELO 1000) from wiping your server progress (ELO 1500).
    if (trustClient) {
        if (body.stardust !== undefined) p.stardust = body.stardust;
        if (body.cometShards !== undefined) p.cometShards = body.cometShards;
        if (body.elo !== undefined) p.elo = body.elo;
    } 

    // --- 2. THEMES (Union Strategy) ---
    // Always merge unlocked items, regardless of seniority.
    const incomingThemes = body.unlockedThemes || [];
    incomingThemes.forEach((t: string) => {
      if (!p.unlockedThemes.includes(t)) {
        p.unlockedThemes.push(t);
      }
    });

    // --- 3. GALAXY SYNC (Union Strategy) ---
    
    // Planets: Merge unlocked planets so progress is never lost
    const incomingNodes = body.unlockedNodeIds || [];
    incomingNodes.forEach((nodeId: string) => {
      if (!g.unlockedNodeIds.includes(nodeId)) {
        g.unlockedNodeIds.push(nodeId);
      }
    });

    // Stars: Merge visual history stars (prevent duplicates by ID)
    const incomingStars = body.historyStars || [];
    const existingStarIds = new Set(g.historyStars.map((star: any) => star.id));
    
    incomingStars.forEach((star: any) => {
      if (!existingStarIds.has(star.id)) {
        g.historyStars.push(star);
      }
    });
    
    // Cap history stars to prevent DB bloat
    if (g.historyStars.length > 1000) {
        g.historyStars = g.historyStars.slice(g.historyStars.length - 1000);
    }

    // --- 4. CUMULATIVE STATS (Max Strategy) ---
    // These metrics generally only increment.
    // We update 'gamesPlayed' based on whoever is higher (usually client if trustClient is true).
    if (clientGames > serverGames) s.gamesPlayed = clientGames;
    
    if ((body.gamesWon || 0) > s.gamesWon) s.gamesWon = body.gamesWon;
    if ((body.flawlessWins || 0) > s.flawlessWins) s.flawlessWins = body.flawlessWins;
    
    // Streak: Update if newer date OR same date with higher streak
    if (body.lastPlayedDate) {
        if (!s.lastPlayedDate || body.lastPlayedDate >= s.lastPlayedDate) {
             s.lastPlayedDate = body.lastPlayedDate;
             s.currentStreak = body.currentStreak;
        }
    }

    // --- 5. BEST TIMES (Min Strategy) ---
    // Keep the fastest time recorded anywhere.
    const updateBestTime = (field: string, incoming: number | null | undefined) => {
        if (!incoming) return; 
        
        // @ts-ignore: Dynamic key access
        const current = s[field];
        // Update if DB is empty (null) OR incoming is faster (lower)
        if (current === null || incoming < current) {
            // @ts-ignore
            s[field] = incoming;
        }
    };

    updateBestTime('bestTimeRelaxed', body.bestTimes?.Relaxed);
    updateBestTime('bestTimeStandard', body.bestTimes?.Standard);
    updateBestTime('bestTimeMastery', body.bestTimes?.Mastery);

    // --- 6. SETTINGS (Overwrite Strategy) ---
    // Settings usually follow the most recent active device.
    if (trustClient) {
        if (body.activeThemeId) set.activeThemeId = body.activeThemeId;
        if (body.audioEnabled !== undefined) set.audioEnabled = body.audioEnabled;
        if (body.timerVisible !== undefined) set.timerVisible = body.timerVisible;
        if (body.autoEraseNotes !== undefined) set.autoEraseNotes = body.autoEraseNotes;
    }

    // Update sync timestamp
    user.lastSyncedAt = new Date();

    // 3. SAVE
    await user.save();

    return NextResponse.json({ 
      success: true, 
      user 
    });

  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}