import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import DailyScore from "@/lib/db/models/DailyScore"; // [NEW]

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    // [NEW] Get Query Params (all-time vs daily)
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all-time';

    // 1. ALL-TIME (ELO)
    if (type === 'all-time') {
        const topPlayers = await User.find({ "stats.gamesPlayed": { $gt: 0 } })
          .sort({ "progression.elo": -1 })
          .limit(50) // Increased limit for scrolling
          .select("name image progression.elo progression.xp");

        let userRankData = null;
        if (session?.user?.email) {
            const currentUser = await User.findOne({ email: session.user.email }).select("progression.elo");
            if (currentUser) {
                const rank = await User.countDocuments({
                    "progression.elo": { $gt: currentUser.progression.elo },
                    "stats.gamesPlayed": { $gt: 0 }
                });
                userRankData = {
                    rank: rank + 1,
                    elo: currentUser.progression.elo,
                    isInTop10: rank < 50
                };
            }
        }
        return NextResponse.json({ topPlayers, userRank: userRankData });
    }

    // 2. DAILY (Time)
    if (type === 'daily') {
        // Get Today's Date String (UTC)
        const today = new Date().toISOString().split('T')[0];
        
        // Find top scores for TODAY, sorted by TIME (Ascending)
        const topDaily = await DailyScore.find({ date: today })
            .sort({ timeSeconds: 1, mistakes: 1 }) // Fastest time, then fewest mistakes
            .limit(50);

        // Map to match the frontend 'LeaderboardEntry' shape
        const formattedDaily = topDaily.map((entry: any) => ({
            _id: entry.userId.toString(),
            name: entry.username,
            image: entry.userImage,
            progression: {
                // For daily view, we display Time instead of ELO
                elo: entry.timeSeconds, // Using 'elo' field to carry Time data to frontend
                xp: 0 // Irrelevant for daily
            },
            isDaily: true // Flag to tell frontend to format 'elo' as Time
        }));

        let userRankData = null;
        if (session?.user?.email) {
            const currentUser = await User.findOne({ email: session.user.email });
            if (currentUser) {
                const myEntry = await DailyScore.findOne({ userId: currentUser._id, date: today });
                if (myEntry) {
                    const rank = await DailyScore.countDocuments({
                        date: today,
                        timeSeconds: { $lt: myEntry.timeSeconds }
                    });
                    userRankData = {
                        rank: rank + 1,
                        elo: myEntry.timeSeconds,
                        isInTop10: rank < 50
                    };
                }
            }
        }

        return NextResponse.json({ topPlayers: formattedDaily, userRank: userRankData });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}