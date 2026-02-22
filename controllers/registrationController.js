import fs from "fs";
import path from "path";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import { generateCertificatePDF } from "../utils/certificateGenerator.js";

/* ===================================================== */
/* REGISTER FOR EVENT (USER) */
/* ===================================================== */
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const count = await EventRegistration.countDocuments({ event: eventId });
    if (count >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    const registration = await EventRegistration.create({
      user: userId,
      event: eventId,
      status: "registered",
      certificateGenerated: false,
      certificatePath: null,
      certificateIssuedAt: null,
    });

    res.status(201).json({
      message: "Registered successfully",
      registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/* ===================================================== */
/* GET MY REGISTRATIONS (USER) */
/* ===================================================== */
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      user: req.user._id,
    }).populate("event");

    res.status(200).json(registrations);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===================================================== */
/* GET REGISTRATIONS BY EVENT (ADMIN / MANAGER) */
/* ===================================================== */
export const getRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await EventRegistration.find({ event: eventId })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json(registrations);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===================================================== */
/* MARK ATTENDANCE (ADMIN / MANAGER) */
/* ===================================================== */
export const markAttendance = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status === "attended") {
      return res.status(400).json({ message: "Already marked attended" });
    }

    registration.status = "attended";
    registration.certificateGenerated = false;
    registration.certificatePath = null;
    registration.certificateIssuedAt = null;

    await registration.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      registration,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===================================================== */
/* DOWNLOAD / PREVIEW CERTIFICATE (USER) */
/* ===================================================== */
export const downloadCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await EventRegistration.findById(registrationId)
      .populate("event")
      .populate("user");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Ownership check
    if (registration.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Eligibility checks
    if (registration.status !== "attended") {
      return res
        .status(400)
        .json({ message: "Attendance not completed" });
    }

    if (!registration.event.certificateEnabled) {
      return res
        .status(400)
        .json({ message: "Certificate not enabled for this event" });
    }

    if (!registration.event.certificateTemplate) {
      return res
        .status(400)
        .json({ message: "Certificate template not uploaded" });
    }

    /* ================= FIX 1: ABSOLUTE TEMPLATE PATH ================= */
    const templatePath = path.resolve(
      registration.event.certificateTemplate
    );

    if (!fs.existsSync(templatePath)) {
      return res
        .status(400)
        .json({ message: "Certificate template file missing" });
    }

    /* ================= FIX 2: IMAGE FORMAT VALIDATION ================= */
    const allowedExt = [".png", ".jpg", ".jpeg"];
    const ext = path.extname(templatePath).toLowerCase();

    if (!allowedExt.includes(ext)) {
      return res.status(400).json({
        message: "Certificate template must be PNG or JPG",
      });
    }

    /* ================= FIX 3: GENERATE FOLDER ================= */
    const generatedDir = path.join("uploads", "generated");
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const outputPath = path.join(
      generatedDir,
      `certificate-${registration._id}.pdf`
    );

    /* ================= FIX 4: GENERATE ONLY ONCE ================= */
    if (!registration.certificateGenerated || !fs.existsSync(outputPath)) {
      await generateCertificatePDF({
        studentName: registration.user.name,
        eventTitle: registration.event.title,
        templatePath,
        outputPath,
      });

      registration.certificateGenerated = true;
      registration.certificatePath = outputPath;
      registration.certificateIssuedAt = new Date();
      await registration.save();
    }

    /* ================= FIX 5: INLINE PREVIEW + DOWNLOAD ================= */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="certificate-${registration._id}.pdf"`
    );

    fs.createReadStream(outputPath).pipe(res);
  } catch (error) {
    console.error("Certificate Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
