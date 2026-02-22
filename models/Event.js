import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ================= DATE & TIME =================
    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    // ================= LOCATION =================
    venue: {
      type: String,
      required: true,
      trim: true,
    },

    // ================= EVENT SETTINGS =================
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    category: {
      type: String,
      enum: ["Workshop", "Seminar", "Hackathon", "Competition", "Other"],
      default: "Other",
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },

    // ================= CERTIFICATE SETTINGS =================
    certificateEnabled: {
      type: Boolean,
      default: false,
    },

    certificateTemplate: {
      type: String,
      default: null, // ✅ FIXED
    },

    // ================= EVENT BANNER =================
    banner: {
      type: String,
      default: "",
    },

    // ================= METADATA =================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Event", eventSchema);
