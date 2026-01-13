import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  image: String,
  
  // 1. PROGRESSION
  progression: {
    elo: { type: Number, default: 1000, index: true },
    eloLastUpdated: { type: Number, default: 0 }, 
    
    xp: { type: Number, default: 0 },
    xpLastUpdated: { type: Number, default: 0 }, 
    
    rank: { type: String, default: "Novice" },
    
    stardust: { type: Number, default: 0 },
    cometShards: { type: Number, default: 0 },
    currencyLastUpdated: { type: Number, default: 0 }, 
    
    unlockedThemes: { type: [String], default: ["midnight"] },
    themesLastUpdated: { type: Number, default: 0 }, 
  },

  // 2. STATISTICS
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    flawlessWins: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: String, default: null }, 
    
    // Best Times (Flattened for DB efficiency)
    bestTimeRelaxed: { type: Number, default: null },
    bestTimeStandard: { type: Number, default: null },
    bestTimeMastery: { type: Number, default: null },
    
    statsLastUpdated: { type: Number, default: 0 }, 
  },

  // 3. SETTINGS & PREFERENCES
  settings: {
    activeThemeId: { type: String, default: "midnight" },
    audioEnabled: { type: Boolean, default: true },
    timerVisible: { type: Boolean, default: true },
    autoEraseNotes: { type: Boolean, default: true },
    
    inputMode: { type: String, default: 'cell-first' },
    textSize: { type: String, default: 'standard' },
    highlightCompletions: { type: Boolean, default: true },
    zenMode: { type: Boolean, default: false }, // [NEW] Persist Zen Mode
    
    settingsLastUpdated: { type: Number, default: 0 }, 
  },

  // 4. GALAXY DATA
  galaxy: {
    unlockedNodeIds: { type: [String], default: ['sun'] },
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

export default mongoose.models.User || mongoose.model("User", UserSchema);