import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// ================= ROUTES =================
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; // ✅ ADMIN STATS + USER MGMT
import certificateRoutes from "./routes/certificateRoutes.js"; // ✅ CERTIFICATES

dotenv.config();

// ================= INIT APP =================
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DB CONNECTION =================
connectDB();

// ================= API ROUTES =================
app.use("/api", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes); // ✅ ADMIN DASHBOARD + USERS
app.use("/api/certificates", certificateRoutes); // ✅ CERTIFICATE DOWNLOAD

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("✅ TechPulse Backend Running...");
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ message: "Server Error" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
