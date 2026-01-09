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
    
    // Destructure ALL fields from the incoming payload
    const { 
      // Progression
      elo, xp, stardust, cometShards, unlockedThemes,
      // Stats
      gamesPlayed, gamesWon, flawlessWins, 
      currentStreak, lastPlayedDate,
      bestTimes, // { Relaxed: 120, Standard: null, ... }
      // Settings
      activeThemeId, audioEnabled, timerVisible, autoEraseNotes
    } = body;

    await dbConnect();

    // CONSTRUCT UPDATE QUERY
    const updateQuery: any = {
      $max: {
        // Progression & Currency
        "progression.elo": elo || 1000,
        "progression.xp": xp || 0,
        "progression.stardust": stardust || 0,
        "progression.cometShards": cometShards || 0,
        
        // Cumulative Stats
        "stats.gamesPlayed": gamesPlayed || 0,
        "stats.gamesWon": gamesWon || 0,
        "stats.flawlessWins": flawlessWins || 0,
        
        // Streak Logic (Date strings compare correctly alphabetically)
        "stats.currentStreak": currentStreak || 0,
        "stats.lastPlayedDate": lastPlayedDate || null, 
      },
      // Themes: Add only unique new themes
      $addToSet: { 
        "progression.unlockedThemes": { $each: unlockedThemes || [] } 
      },
      // Settings: Always overwrite with latest preference
      $set: {
        "settings.activeThemeId": activeThemeId || "midnight",
        "settings.audioEnabled": audioEnabled ?? true,
        "settings.timerVisible": timerVisible ?? true,
        "settings.autoEraseNotes": autoEraseNotes ?? true,
        lastSyncedAt: new Date(),
      }
    };

    // HANDLE BEST TIMES ($min)
    // We only want to apply $min if the incoming time is valid (not null/0)
    // AND we want to update if the DB has null (which counts as "infinity" for best times)
    if (!updateQuery.$min) updateQuery.$min = {};
    
    // NOTE: MongoDB $min compares null as "less than" numbers, so we rely on the
    // Frontend store logic to handle the null checks before sending, or we assume 
    // the DB initializes these as null and we overwrite them on first win.
    if (bestTimes?.Relaxed) updateQuery.$min["stats.bestTimeRelaxed"] = bestTimes.Relaxed;
    if (bestTimes?.Standard) updateQuery.$min["stats.bestTimeStandard"] = bestTimes.Standard;
    if (bestTimes?.Mastery) updateQuery.$min["stats.bestTimeMastery"] = bestTimes.Mastery;

    // PERFORM UPDATE
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      updateQuery,
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}