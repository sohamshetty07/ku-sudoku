import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // 1. HARD RESET (Explicitly set every field to its default)
    await User.updateOne(
      { email: session.user.email },
      {
        $set: {
          // Progression
          "progression.elo": 1000,
          "progression.xp": 0,
          "progression.rank": "Novice", // Reset rank too
          "progression.stardust": 0,
          "progression.cometShards": 0,
          "progression.unlockedThemes": ['midnight'],
          
          // Stats
          "stats.gamesPlayed": 0,
          "stats.gamesWon": 0,
          "stats.flawlessWins": 0,
          "stats.currentStreak": 0,
          "stats.lastPlayedDate": null,
          
          // Best Times (Reset to null)
          "stats.bestTimeRelaxed": null,
          "stats.bestTimeStandard": null,
          "stats.bestTimeMastery": null,

          // Settings (Optional: Resetting these gives a true "Fresh" feel)
          "settings.activeThemeId": "midnight",
          "settings.audioEnabled": true,
          "settings.timerVisible": true,
          "settings.autoEraseNotes": true,

          lastSyncedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, message: "Account completely reset." });
  } catch (error) {
    console.error("Reset Failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}