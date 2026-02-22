import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  registerForEvent,
  getMyRegistrations,
  getRegistrationsByEvent,
  markAttendance,
  downloadCertificate, // ✅ NEW
} from "../controllers/registrationController.js";

const router = express.Router();

/* ================= USER ================= */

// Register for event
router.post("/:eventId", authMiddleware, registerForEvent);

// Get logged-in user's registered events
router.get("/my-events", authMiddleware, getMyRegistrations);

// ✅ DOWNLOAD CERTIFICATE (USER)
router.get(
  "/:registrationId/certificate",
  authMiddleware,
  downloadCertificate
);

/* ================= ADMIN / MANAGER ================= */

// Get registrations for specific event
router.get(
  "/event/:eventId",
  authMiddleware,
  roleMiddleware("Admin", "Manager"),
  getRegistrationsByEvent
);

// Mark attendance
router.put(
  "/:registrationId/attend",
  authMiddleware,
  roleMiddleware("Admin", "Manager"),
  markAttendance
);

export default router;
