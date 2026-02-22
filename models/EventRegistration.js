import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    /**
     * Registration status
     * registered → user signed up
     * attended   → eligible for certificate
     * cancelled  → registration revoked
     */
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered",
    },

    /**
     * ================= CERTIFICATE METADATA =================
     */

    // Has certificate been generated
    certificateGenerated: {
      type: Boolean,
      default: false,
    },

    // Path to generated certificate PDF
    certificatePath: {
      type: String,
      default: null,
    },

    // When certificate was issued
    certificateIssuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "event_registrations",
  }
);

// 🔒 Prevent duplicate registrations
eventRegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model(
  "EventRegistration",
  eventRegistrationSchema
);
