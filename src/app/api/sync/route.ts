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

    const p = user.progression;
    const s = user.stats;
    const set = user.settings;
    const g = user.galaxy;

    // --- HELPER: TIMESTAMP MERGE LOGIC ---
    const shouldUpdate = (clientTs: number | undefined, serverTs: number | undefined) => {
        const c = clientTs || 0;
        const sv = serverTs || 0;
        return c > sv;
    };

    // --- 1. PROGRESSION MERGE ---

    // A. ELO & XP
    if (shouldUpdate(body.eloLastUpdated, p.eloLastUpdated)) {
        p.elo = body.elo;
        p.eloLastUpdated = body.eloLastUpdated;
    }

    if (shouldUpdate(body.xpLastUpdated, p.xpLastUpdated)) {
        p.xp = body.xp;
        p.xpLastUpdated = body.xpLastUpdated;
    }

    // B. TRANSACTION PROCESSING
    const transactions = body.transactions || [];
    const processedIds: string[] = [];
    let currencyModified = false;
    let themesModified = false;

    if (transactions.length > 0) {
        for (const tx of transactions) {
            try {
                if (tx.type === 'EARN_CURRENCY') {
                    const { type, amount } = tx.payload;
                    if (type === 'stardust') p.stardust = (p.stardust || 0) + amount;
                    if (type === 'cometShards') p.cometShards = (p.cometShards || 0) + amount;
                    currencyModified = true;
                }
                else if (tx.type === 'SPEND_CURRENCY') {
                    const { type, amount } = tx.payload;
                    if (type === 'stardust') p.stardust = Math.max(0, (p.stardust || 0) - amount);
                    if (type === 'cometShards') p.cometShards = Math.max(0, (p.cometShards || 0) - amount);
                    currencyModified = true;
                }
                else if (tx.type === 'UNLOCK_THEME') {
                    const { themeId } = tx.payload;
                    if (!p.unlockedThemes.includes(themeId)) {
                        p.unlockedThemes.push(themeId);
                        themesModified = true;
                    }
                }
                processedIds.push(tx.id);
            } catch (e) {
                console.warn(`Failed to process transaction ${tx.id}`, e);
            }
        }
        
        if (currencyModified) p.currencyLastUpdated = Date.now();
        if (themesModified) p.themesLastUpdated = Date.now();
    } 
    // Fallback: If no transactions, use Timestamp Sync
    else {
        if (shouldUpdate(body.currencyLastUpdated, p.currencyLastUpdated)) {
            p.stardust = body.stardust;
            p.cometShards = body.cometShards;
            p.currencyLastUpdated = body.currencyLastUpdated;
        }
    }

    // C. THEMES (Union Strategy - Fallback)
    const incomingThemes = body.unlockedThemes || [];
    incomingThemes.forEach((t: string) => {
      if (!p.unlockedThemes.includes(t)) {
        p.unlockedThemes.push(t);
      }
    });
    if (shouldUpdate(body.themesLastUpdated, p.themesLastUpdated)) {
        p.themesLastUpdated = body.themesLastUpdated || Date.now();
    }

    // --- 2. STATS MERGE ---
    if (shouldUpdate(body.statsLastUpdated, s.statsLastUpdated)) {
        const incStats = body.stats || {};
        s.gamesPlayed = incStats.gamesPlayed ?? s.gamesPlayed;
        s.gamesWon = incStats.gamesWon ?? s.gamesWon;
        s.flawlessWins = incStats.flawlessWins ?? s.flawlessWins;
        s.currentStreak = incStats.currentStreak ?? s.currentStreak;
        s.lastPlayedDate = incStats.lastPlayedDate ?? s.lastPlayedDate;
        
        if (incStats.bestTimes) {
            s.bestTimeRelaxed = incStats.bestTimes.Relaxed ?? s.bestTimeRelaxed;
            s.bestTimeStandard = incStats.bestTimes.Standard ?? s.bestTimeStandard;
            s.bestTimeMastery = incStats.bestTimes.Mastery ?? s.bestTimeMastery;
        }
        s.statsLastUpdated = body.statsLastUpdated;
    } else {
        if (body.stats?.bestTimes) {
            const checkBetter = (dbField: string, incomingVal: number | null) => {
                // @ts-ignore
                if (incomingVal && (s[dbField] === null || incomingVal < s[dbField])) {
                    // @ts-ignore
                    s[dbField] = incomingVal;
                }
            };
            checkBetter('bestTimeRelaxed', body.stats.bestTimes.Relaxed);
            checkBetter('bestTimeStandard', body.stats.bestTimes.Standard);
            checkBetter('bestTimeMastery', body.stats.bestTimes.Mastery);
        }
    }

    // --- 3. SETTINGS MERGE ---
    if (shouldUpdate(body.settingsLastUpdated, set.settingsLastUpdated)) {
        const incSet = body.settings || {};
        set.activeThemeId = incSet.activeThemeId ?? set.activeThemeId;
        set.audioEnabled = incSet.audioEnabled ?? set.audioEnabled;
        set.timerVisible = incSet.timerVisible ?? set.timerVisible;
        set.autoEraseNotes = incSet.autoEraseNotes ?? set.autoEraseNotes;
        set.inputMode = incSet.inputMode ?? set.inputMode;
        set.textSize = incSet.textSize ?? set.textSize;
        set.highlightCompletions = incSet.highlightCompletions ?? set.highlightCompletions;
        set.zenMode = incSet.zenMode ?? set.zenMode; // [ADDED] Zen Mode Sync
        set.settingsLastUpdated = body.settingsLastUpdated;
    }

    // --- 4. GALAXY MERGE ---
    const incomingNodes = body.unlockedNodeIds || [];
    incomingNodes.forEach((nodeId: string) => {
      if (!g.unlockedNodeIds.includes(nodeId)) g.unlockedNodeIds.push(nodeId);
    });

    const incomingStars = body.historyStars || [];
    const existingStarIds = new Set(g.historyStars.map((star: any) => star.id));
    incomingStars.forEach((star: any) => {
      if (!existingStarIds.has(star.id)) g.historyStars.push(star);
    });
    
    if (g.historyStars.length > 500) {
        g.historyStars = g.historyStars.slice(g.historyStars.length - 500);
    }

    // --- SAVE & RESPOND ---
    user.lastSyncedAt = new Date();
    
    user.markModified('progression');
    user.markModified('stats');
    user.markModified('settings');
    user.markModified('galaxy');

    await user.save();

    return NextResponse.json({ 
      success: true, 
      user,
      processedTransactionIds: processedIds 
    });

  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}