// server/routes/adminRoutes.js
import express from "express";
import {
  getAllUsers,
  updateUserRole,
  getAdminStats,
} from "../controllers/adminController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ================= ADMIN ONLY ROUTES ================= */

// Get all users
router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUsers
);

// Update user role
router.put(
  "/role",
  authMiddleware,
  roleMiddleware("admin"),
  updateUserRole
);

// Admin dashboard statistics (STEP E)
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminStats
);

export default router;
