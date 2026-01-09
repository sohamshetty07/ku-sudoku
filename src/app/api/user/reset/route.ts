import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// 1. FIXED IMPORT: Import from your existing NextAuth route
import { authOptions } from "@/lib/auth"; 
// 2. FIXED IMPORTS: Use your Mongoose setup instead of raw clientPromise
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // 3. RESET LOGIC (Mongoose)
    // We map the reset values to your Schema structure (progression.*, stats.*)
    await User.updateOne(
      { email: session.user.email },
      {
        $set: {
          "progression.elo": 1000,
          "progression.xp": 0,
          "progression.stardust": 0,
          "progression.cometShards": 0,
          "progression.unlockedThemes": ['midnight'],
          
          "stats.gamesPlayed": 0,
          "stats.gamesWon": 0,
          // Add other fields here if your Schema has them (e.g. flawlessWins)
        },
      }
    );

    return NextResponse.json({ success: true, message: "Account reset." });
  } catch (error) {
    console.error("Reset Failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}