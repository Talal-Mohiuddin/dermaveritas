import mongoose from "mongoose";

const { Schema } = mongoose;

const bannedUserSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    bannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const BannedUsers = mongoose.model("BannedUsers", bannedUserSchema);
