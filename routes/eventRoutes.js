import express from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventsWithRegistrationCount,
  toggleCertificate,
  uploadCertificateTemplate,
} from "../controllers/eventController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import uploadCertificate from "../middleware/uploadCertificate.js";

const router = express.Router();

/* ================= ADMIN / MANAGER ================= */

router.get(
  "/admin/with-count",
  authMiddleware,
  roleMiddleware("admin", "manager"),
  getEventsWithRegistrationCount
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "manager"),
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "manager"),
  updateEvent
);

router.put(
  "/:id/certificate",
  authMiddleware,
  roleMiddleware("admin"),
  toggleCertificate
);

// ✅ FIXED FIELD NAME
router.put(
  "/:id/certificate-template",
  authMiddleware,
  roleMiddleware("admin", "manager"),
  uploadCertificate.single("certificate"),
  uploadCertificateTemplate
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "manager"),
  deleteEvent
);

/* ================= USER ================= */

router.get("/", authMiddleware, getEvents);
router.get("/:id", authMiddleware, getEvent);

export default router;
