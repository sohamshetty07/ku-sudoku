import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 1. HARD RESET (Explicitly set every field to its default)
    // We use findOneAndUpdate with $set to replace entire sub-documents
    // ensuring we wipe new timestamp fields and any stray data.
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          // 1. Progression & Timestamps
          progression: {
            elo: 1000,
            eloLastUpdated: 0,
            xp: 0,
            xpLastUpdated: 0,
            rank: "Novice",
            stardust: 0,
            cometShards: 0,
            currencyLastUpdated: 0,
            unlockedThemes: ["midnight"],
            themesLastUpdated: 0,
          },
          
          // 2. Stats & Timestamps
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            flawlessWins: 0,
            currentStreak: 0,
            lastPlayedDate: null,
            bestTimeRelaxed: null,
            bestTimeStandard: null,
            bestTimeMastery: null,
            statsLastUpdated: 0,
          },

          // 3. Settings (Including new visual/input preferences)
          settings: {
            activeThemeId: "midnight",
            audioEnabled: true,
            timerVisible: true,
            autoEraseNotes: true,
            inputMode: "cell-first",
            textSize: "standard",
            highlightCompletions: true,
            settingsLastUpdated: 0,
          },

          // 4. Galaxy Data
          galaxy: {
            unlockedNodeIds: ['sun'],
            historyStars: []
          },

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