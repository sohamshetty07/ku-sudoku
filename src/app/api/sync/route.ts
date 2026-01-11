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

    // 1. FETCH (Fetch-Merge-Save Strategy)
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = new User({ email: session.user.email });
    }

    // 2. MERGE LOGIC
    // Ensure sub-documents exist for legacy users or new accounts
    if (!user.progression) user.progression = {};
    if (!user.stats) user.stats = {};
    if (!user.settings) user.settings = {};
    if (!user.galaxy) user.galaxy = { unlockedNodeIds: ['sun'], historyStars: [] };

    const p = user.progression;
    const s = user.stats;
    const set = user.settings;
    const g = user.galaxy;

    // --- PROGRESSION: XP (Max Strategy) ---
    // XP only goes up, so it is safe to strictly take the higher value.
    if ((body.xp || 0) > p.xp) p.xp = body.xp;

    // --- ECONOMY & ELO (Client Authority Strategy) ---
    // [FIXED] Currency decreases when spent. ELO decreases on loss.
    // We must trust the active client's wallet state over the server's old state.
    if (body.stardust !== undefined) p.stardust = body.stardust;
    if (body.cometShards !== undefined) p.cometShards = body.cometShards;
    if (body.elo !== undefined) p.elo = body.elo;

    // --- THEMES (Union Strategy) ---
    // We combine themes so purchases from different devices are merged.
    const incomingThemes = body.unlockedThemes || [];
    incomingThemes.forEach((t: string) => {
      if (!p.unlockedThemes.includes(t)) {
        p.unlockedThemes.push(t);
      }
    });

    // --- [NEW] GALAXY SYNC (Union Strategy) ---
    
    // 1. PLANETS: Merge unlocked planets so progress is never lost
    const incomingNodes = body.unlockedNodeIds || [];
    incomingNodes.forEach((nodeId: string) => {
      if (!g.unlockedNodeIds.includes(nodeId)) {
        g.unlockedNodeIds.push(nodeId);
      }
    });

    // 2. STARS: Merge visual history stars (prevent duplicates by ID)
    const incomingStars = body.historyStars || [];
    // Create a Set of existing IDs for O(1) lookup to avoid duplicates
    // Note: We cast to 'any' because Mongoose types might be strict here
    const existingStarIds = new Set(g.historyStars.map((star: any) => star.id));
    
    incomingStars.forEach((star: any) => {
      if (!existingStarIds.has(star.id)) {
        g.historyStars.push(star);
      }
    });
    
    // Cap history stars to prevent DB bloat (e.g., keep last 1000)
    // This keeps the sync payload light over time
    if (g.historyStars.length > 1000) {
        g.historyStars = g.historyStars.slice(g.historyStars.length - 1000);
    }

    // --- CUMULATIVE STATS (Max Strategy) ---
    // These metrics generally only increment.
    if ((body.gamesPlayed || 0) > s.gamesPlayed) s.gamesPlayed = body.gamesPlayed;
    if ((body.gamesWon || 0) > s.gamesWon) s.gamesWon = body.gamesWon;
    if ((body.flawlessWins || 0) > s.flawlessWins) s.flawlessWins = body.flawlessWins;
    
    // Streak: Update if newer date OR same date with higher streak
    if (body.lastPlayedDate) {
        if (!s.lastPlayedDate || body.lastPlayedDate >= s.lastPlayedDate) {
             s.lastPlayedDate = body.lastPlayedDate;
             s.currentStreak = body.currentStreak;
        }
    }

    // --- BEST TIMES (Min Strategy with Null Checks) ---
    // Use 'any' for key indexing to satisfy TS strict mode if needed, or define specific type
    const updateBestTime = (field: string, incoming: number | null | undefined) => {
        if (!incoming) return; 
        
        // @ts-ignore: Dynamic access to Mongoose subdocument
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

    // --- SETTINGS (Overwrite Strategy) ---
    if (body.activeThemeId) set.activeThemeId = body.activeThemeId;
    if (body.audioEnabled !== undefined) set.audioEnabled = body.audioEnabled;
    if (body.timerVisible !== undefined) set.timerVisible = body.timerVisible;
    if (body.autoEraseNotes !== undefined) set.autoEraseNotes = body.autoEraseNotes;

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