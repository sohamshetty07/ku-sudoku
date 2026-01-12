import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  image: String,
  
  // 1. PROGRESSION (Currency & XP)
  progression: {
    // [OPTIMIZATION] Indexing ELO allows instant sorting of leaderboards
    elo: { type: Number, default: 1000, index: true },
    eloLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
    
    xp: { type: Number, default: 0 },
    xpLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
    
    rank: { type: String, default: "Novice" },
    
    stardust: { type: Number, default: 0 },
    cometShards: { type: Number, default: 0 },
    currencyLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
    
    unlockedThemes: { type: [String], default: ["midnight"] },
    themesLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
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
    
    statsLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
  },

  // 3. SETTINGS & PREFERENCES
  settings: {
    activeThemeId: { type: String, default: "midnight" },
    audioEnabled: { type: Boolean, default: true },
    timerVisible: { type: Boolean, default: true },
    autoEraseNotes: { type: Boolean, default: true },
    
    // [NEW] Persist Visual/Input Settings
    inputMode: { type: String, default: 'cell-first' },
    textSize: { type: String, default: 'standard' },
    highlightCompletions: { type: Boolean, default: true },
    
    settingsLastUpdated: { type: Number, default: 0 }, // [NEW] Timestamp for Sync
  },

  // 4. GALAXY DATA (Astral Chart)
  galaxy: {
    unlockedNodeIds: { type: [String], default: ['sun'] }, // e.g. ['sun', 'mercury']
    historyStars: [{
      id: String,
      x: Number,
      y: Number,
      size: Number,
      opacity: Number,
      dateUnlocked: String
    }]
  },

  lastSyncedAt: { type: Date, default: Date.now },
});

// This check prevents Mongoose from re-compiling the model during Hot Reloads in Next.js
export default mongoose.models.User || mongoose.model("User", UserSchema);