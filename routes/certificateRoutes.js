// server/routes/certificateRoutes.js
import express from "express";
import {
  downloadCertificate,
  verifyCertificate, // ✅ NEW
} from "../controllers/certificateController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= CERTIFICATE DOWNLOAD ================= */
/*
  GET /api/certificates/:registrationId
  - User must be logged in
  - User must own the registration
  - Registration status must be "attended"
*/
router.get(
  "/:registrationId",
  authMiddleware,
  downloadCertificate
);

/* ================= PUBLIC CERTIFICATE VERIFICATION ================= */
/*
  GET /api/certificates/verify/:registrationId
  - Public route
  - Used by QR code
*/
router.get(
  "/verify/:registrationId",
  verifyCertificate
);

export default router;
