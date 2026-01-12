import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connect";
import DailyScore from "@/lib/db/models/DailyScore";
import User from "@/lib/db/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { timeSeconds, mistakes, date } = body;

    // Validate inputs
    if (typeof timeSeconds !== 'number' || typeof mistakes !== 'number' || !date) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await dbConnect();

    // 1. Get User ID
    const user = await User.findOne({ email: session.user.email }).select("_id name image");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Prevent Duplicate Submissions
    // We check if a score already exists for this user + date
    const existing = await DailyScore.findOne({ userId: user._id, date });
    
    if (existing) {
        // Optional: If you want to allow "Retries" that only update if the score is BETTER
        if (timeSeconds < existing.timeSeconds) {
            existing.timeSeconds = timeSeconds;
            existing.mistakes = mistakes;
            existing.submittedAt = new Date();
            await existing.save();
            return NextResponse.json({ success: true, message: "New personal best updated!" });
        }
        return NextResponse.json({ success: false, message: "You have already completed today's challenge." });
    }

    // 3. Create New Score
    await DailyScore.create({
        userId: user._id,
        username: user.name || "Anonymous",
        userImage: user.image,
        date,
        timeSeconds,
        mistakes
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Daily Submit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}