// server/controllers/certificateController.js
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";
import QRCode from "qrcode";
import EventRegistration from "../models/EventRegistration.js";

/* ================= CERTIFICATE DOWNLOAD ================= */
export const downloadCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user._id;

    const registration = await EventRegistration.findById(registrationId)
      .populate("user", "name email")
      .populate(
        "event",
        "title date certificateEnabled certificateTemplate"
      );

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found",
      });
    }

    if (registration.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!registration.event.certificateEnabled) {
      return res.status(403).json({
        message: "Certificate not enabled by admin yet",
      });
    }

    if (registration.status !== "attended") {
      return res.status(400).json({
        message:
          "Certificate available only after attendance confirmation",
      });
    }

    if (!registration.event.certificateTemplate) {
      return res.status(500).json({
        message: "Certificate template not configured",
      });
    }

    // ================= LOAD TEMPLATE =================
    const template = await loadImage(
      registration.event.certificateTemplate
    );

    const canvas = createCanvas(
      template.width,
      template.height
    );
    const ctx = canvas.getContext("2d");

    ctx.drawImage(template, 0, 0);

    // ================= TEXT =================
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    ctx.font = "bold 64px Times New Roman";
    ctx.fillText(
      registration.user.name,
      template.width / 2,
      template.height / 2 + 40
    );

    ctx.font = "32px Times New Roman";
    ctx.fillText(
      registration.event.title,
      template.width / 2,
      template.height / 2 + 110
    );

    ctx.font = "20px Times New Roman";
    ctx.fillText(
      new Date(registration.event.date).toDateString(),
      template.width / 2,
      template.height / 2 + 160
    );

    // ================= QR CODE =================
    const verifyUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/verify-certificate/${registration._id}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 180,
      margin: 1,
    });

    const qrImage = await loadImage(qrDataUrl);

    ctx.drawImage(
      qrImage,
      template.width - 220,
      template.height - 220,
      180,
      180
    );

    // ================= CREATE PDF =================
    const pdf = new PDFDocument({
      size: [template.width, template.height],
      margin: 0,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${registration._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    pdf.pipe(res);

    const imageBuffer = canvas.toBuffer("image/png");
    pdf.image(imageBuffer, 0, 0, {
      width: template.width,
      height: template.height,
    });

    pdf.end();

    if (!registration.certificateIssuedAt) {
      registration.certificateIssuedAt = new Date();
      await registration.save();
    }
  } catch (error) {
    console.error("Certificate Error:", error);
    res.status(500).json({
      message: "Failed to generate certificate",
    });
  }
};

/* ================= PUBLIC CERTIFICATE VERIFICATION ================= */
export const verifyCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await EventRegistration.findById(
      registrationId
    )
      .populate("user", "name email")
      .populate("event", "title date");

    if (!registration || !registration.certificateIssuedAt) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found or not issued",
      });
    }

    res.status(200).json({
      valid: true,
      participant: registration.user.name,
      email: registration.user.email,
      event: registration.event.title,
      eventDate: registration.event.date,
      issuedAt: registration.certificateIssuedAt,
      certificateId: registration._id,
    });
  } catch (error) {
    console.error("Verify Certificate Error:", error);
    res.status(500).json({
      valid: false,
      message: "Failed to verify certificate",
    });
  }
};
