import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";

// 🔴 CHANGE THIS IF NEEDED
const MONGO_URI = "mongodb://127.0.0.1:27017/techpulse";

const runFix = async () => {
  try {
    console.log("🔧 Connecting to database...");
    await mongoose.connect(MONGO_URI);

    const registrations = await EventRegistration.find()
      .populate("event");

    let fixed = 0;

    for (const reg of registrations) {
      if (!reg.certificateGenerated) continue;

      let broken = false;

      // ❌ Missing event
      if (!reg.event) broken = true;

      // ❌ Certificate disabled
      if (reg.event && !reg.event.certificateEnabled) broken = true;

      // ❌ Template missing
      if (
        reg.event &&
        (!reg.event.certificateTemplate ||
          !fs.existsSync(path.resolve(reg.event.certificateTemplate)))
      ) {
        broken = true;
      }

      // ❌ Generated file missing
      if (
        reg.certificatePath &&
        !fs.existsSync(path.resolve(reg.certificatePath))
      ) {
        broken = true;
      }

      if (broken) {
        reg.certificateGenerated = false;
        reg.certificatePath = null;
        reg.certificateIssuedAt = null;
        await reg.save();
        fixed++;
      }
    }

    console.log(`✅ Cleanup done. Fixed ${fixed} records.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
};

runFix();
