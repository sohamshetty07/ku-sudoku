import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  image: String,
  
  // 1. PROGRESSION (Currency & XP)
  progression: {
    elo: { type: Number, default: 1000 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: "Novice" },
    stardust: { type: Number, default: 0 },
    cometShards: { type: Number, default: 0 },
    unlockedThemes: { type: [String], default: ["midnight"] },
  },

  // 2. STATISTICS (The "Archives")
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    flawlessWins: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: String, default: null }, // Stored as "YYYY-MM-DD"
    
    // Best Times (Lower is Better)
    // We flatten these to make database updates easier
    bestTimeRelaxed: { type: Number, default: null },
    bestTimeStandard: { type: Number, default: null },
    bestTimeMastery: { type: Number, default: null },
  },

  // 3. SETTINGS & PREFERENCES
  settings: {
    activeThemeId: { type: String, default: "midnight" },
    audioEnabled: { type: Boolean, default: true },
    timerVisible: { type: Boolean, default: true },
    autoEraseNotes: { type: Boolean, default: true },
  },

  lastSyncedAt: { type: Date, default: Date.now },
});

// This check prevents Mongoose from re-compiling the model during Hot Reloads in Next.js
export default mongoose.models.User || mongoose.model("User", UserSchema);