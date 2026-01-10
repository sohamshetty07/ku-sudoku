import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export const dynamic = 'force-dynamic'; // Disable static caching for live rankings

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const currentUserEmail = session?.user?.email;

    // 1. FETCH TOP 10 (The Apex)
    // We select only necessary fields to save bandwidth
    const topPlayers = await User.find({})
      .sort({ "progression.elo": -1 }) // Descending order (Highest first)
      .limit(10)
      .select("name image progression.elo progression.xp");

    // 2. FETCH CURRENT USER RANK (The Anchor)
    let userRankData = null;

    if (currentUserEmail) {
      const currentUser = await User.findOne({ email: currentUserEmail }).select("progression.elo");
      
      if (currentUser) {
        // Count how many people have a higher ELO than the current user
        const rank = await User.countDocuments({
          "progression.elo": { $gt: currentUser.progression.elo }
        });

        userRankData = {
          rank: rank + 1, // 0-indexed count -> 1-indexed rank
          elo: currentUser.progression.elo,
          isInTop10: rank < 10 // Helper to hide sticky footer if you're already visible
        };
      }
    }

    return NextResponse.json({
      topPlayers,
      userRank: userRankData
    });

  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}