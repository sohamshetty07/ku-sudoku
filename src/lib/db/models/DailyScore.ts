import mongoose from "mongoose";

const DailyScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // We store a snapshot of the user's details at the time of the record
  // to avoid complex joins (Populate) for simple leaderboards
  username: String,
  userImage: String,
  
  date: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD"
  
  timeSeconds: { type: Number, required: true }, // Lower is better
  mistakes: { type: Number, required: true },
  
  submittedAt: { type: Date, default: Date.now }
});

// Compound index: A user can only have ONE score per DATE
DailyScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyScore || mongoose.model("DailyScore", DailyScoreSchema);