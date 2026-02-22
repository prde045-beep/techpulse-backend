import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getAllUsers,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

/* ================= ADMIN ROUTES ================= */

// GET all users (Admin only)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUsers
);

// UPDATE user role (Admin only)
router.put(
  "/:id/role",
  authMiddleware,
  roleMiddleware("admin"),
  updateUserRole
);

export default router;
