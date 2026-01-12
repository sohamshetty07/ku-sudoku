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

    // 1. FETCH USER
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = new User({ email: session.user.email });
    }

    // Ensure sub-documents exist
    if (!user.progression) user.progression = {};
    if (!user.stats) user.stats = {};
    if (!user.settings) user.settings = {};
    if (!user.galaxy) user.galaxy = { unlockedNodeIds: ['sun'], historyStars: [] };

    // Create shorthand references
    const p = user.progression;
    const s = user.stats;
    const set = user.settings;
    const g = user.galaxy;

    // --- HELPER: TIMESTAMP MERGE LOGIC ---
    // Returns true if server was updated
    const shouldUpdate = (clientTs: number | undefined, serverTs: number | undefined) => {
        const c = clientTs || 0;
        const sv = serverTs || 0;
        return c > sv;
    };

    // --- 1. PROGRESSION MERGE ---

    // A. ELO (Skill)
    if (shouldUpdate(body.eloLastUpdated, p.eloLastUpdated)) {
        p.elo = body.elo;
        p.eloLastUpdated = body.eloLastUpdated;
    }

    // B. XP (Experience)
    // XP only goes up, but we use timestamp to be safe against race conditions
    if (shouldUpdate(body.xpLastUpdated, p.xpLastUpdated)) {
        p.xp = body.xp;
        p.xpLastUpdated = body.xpLastUpdated;
    }

    // C. CURRENCY (Stardust/Shards)
    if (shouldUpdate(body.currencyLastUpdated, p.currencyLastUpdated)) {
        p.stardust = body.stardust;
        p.cometShards = body.cometShards;
        p.currencyLastUpdated = body.currencyLastUpdated;
    }

    // D. THEMES (Unlockables)
    // Union Strategy: Always merge unlocked items (never remove them)
    const incomingThemes = body.unlockedThemes || [];
    let themesChanged = false;
    incomingThemes.forEach((t: string) => {
      if (!p.unlockedThemes.includes(t)) {
        p.unlockedThemes.push(t);
        themesChanged = true;
      }
    });
    // If we added themes OR the client has a newer timestamp for the same set, update timestamp
    if (themesChanged || shouldUpdate(body.themesLastUpdated, p.themesLastUpdated)) {
        p.themesLastUpdated = body.themesLastUpdated || Date.now();
    }


    // --- 2. STATS MERGE (Lifetime Data) ---
    // We treat the entire 'stats' block as one atomic unit for timestamping
    // to prevent inconsistent states (e.g., gamesPlayed mismatching gamesWon).
    if (shouldUpdate(body.statsLastUpdated, s.statsLastUpdated)) {
        const incStats = body.stats || {};
        
        s.gamesPlayed = incStats.gamesPlayed ?? s.gamesPlayed;
        s.gamesWon = incStats.gamesWon ?? s.gamesWon;
        s.flawlessWins = incStats.flawlessWins ?? s.flawlessWins;
        s.currentStreak = incStats.currentStreak ?? s.currentStreak;
        s.lastPlayedDate = incStats.lastPlayedDate ?? s.lastPlayedDate;
        
        // Best Times
        if (incStats.bestTimes) {
            s.bestTimeRelaxed = incStats.bestTimes.Relaxed ?? s.bestTimeRelaxed;
            s.bestTimeStandard = incStats.bestTimes.Standard ?? s.bestTimeStandard;
            s.bestTimeMastery = incStats.bestTimes.Mastery ?? s.bestTimeMastery;
        }

        s.statsLastUpdated = body.statsLastUpdated;
    } else {
        // Edge Case: If timestamps are equal or server is newer, 
        // we STILL check "Max Strategy" for Best Times (lower is better) 
        // just in case a device played offline and beat a record but sync logic got messy.
        const mergeBestTime = (field: string, incoming: number | null) => {
            if (!incoming) return;
            // @ts-ignore
            const current = s[field];
            if (current === null || incoming < current) {
                // @ts-ignore
                s[field] = incoming;
            }
        };
        if (body.stats?.bestTimes) {
            mergeBestTime('bestTimeRelaxed', body.stats.bestTimes.Relaxed);
            mergeBestTime('bestTimeStandard', body.stats.bestTimes.Standard);
            mergeBestTime('bestTimeMastery', body.stats.bestTimes.Mastery);
        }
    }


    // --- 3. SETTINGS MERGE ---
    if (shouldUpdate(body.settingsLastUpdated, set.settingsLastUpdated)) {
        const incSet = body.settings || {};
        
        set.activeThemeId = incSet.activeThemeId ?? set.activeThemeId;
        set.audioEnabled = incSet.audioEnabled ?? set.audioEnabled;
        set.timerVisible = incSet.timerVisible ?? set.timerVisible;
        set.autoEraseNotes = incSet.autoEraseNotes ?? set.autoEraseNotes;
        
        // New settings
        set.inputMode = incSet.inputMode ?? set.inputMode;
        set.textSize = incSet.textSize ?? set.textSize;
        set.highlightCompletions = incSet.highlightCompletions ?? set.highlightCompletions;

        set.settingsLastUpdated = body.settingsLastUpdated;
    }


    // --- 4. GALAXY MERGE (Union Strategy) ---
    // Galaxy data is "Unlock Only" - we never re-lock nodes.
    const incomingNodes = body.unlockedNodeIds || [];
    incomingNodes.forEach((nodeId: string) => {
      if (!g.unlockedNodeIds.includes(nodeId)) {
        g.unlockedNodeIds.push(nodeId);
      }
    });

    // History Stars: Union by ID to prevent duplicates
    const incomingStars = body.historyStars || [];
    const existingStarIds = new Set(g.historyStars.map((star: any) => star.id));
    
    incomingStars.forEach((star: any) => {
      if (!existingStarIds.has(star.id)) {
        g.historyStars.push(star);
      }
    });
    
    // Cap history to prevent DB bloat
    if (g.historyStars.length > 500) {
        // Sort by timestamp (assuming id contains timestamp or insertion order) 
        // and keep last 500
        g.historyStars = g.historyStars.slice(g.historyStars.length - 500);
    }


    // --- SAVE & RESPOND ---
    user.lastSyncedAt = new Date();
    
    // Mark modified paths if Mongoose doesn't auto-detect deeply nested changes
    user.markModified('progression');
    user.markModified('stats');
    user.markModified('settings');
    user.markModified('galaxy');

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