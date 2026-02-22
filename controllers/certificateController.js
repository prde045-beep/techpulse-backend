// server/controllers/certificateController.js
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import EventRegistration from "../models/EventRegistration.js";

/* ================= CERTIFICATE DOWNLOAD ================= */
export const downloadCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user._id;

    const registration = await EventRegistration.findById(registrationId)
      .populate("user", "name email")
      .populate("event", "title date certificateEnabled");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!registration.event.certificateEnabled) {
      return res
        .status(403)
        .json({ message: "Certificate not enabled by admin yet" });
    }

    if (registration.status !== "attended") {
      return res.status(400).json({
        message:
          "Certificate available only after attendance confirmation",
      });
    }

    // ================= CREATE PDF =================
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${registration._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // ================= TITLE =================
    doc
      .fontSize(40)
      .text("Certificate of Participation", {
        align: "center",
      });

    doc.moveDown(2);

    doc
      .fontSize(20)
      .text("This is to certify that", {
        align: "center",
      });

    doc.moveDown(1);

    // ================= USER NAME =================
    doc
      .fontSize(36)
      .fillColor("#000")
      .text(registration.user.name, {
        align: "center",
      });

    doc.moveDown(1);

    // ================= EVENT =================
    doc
      .fontSize(22)
      .text(
        `has successfully attended "${registration.event.title}"`,
        { align: "center" }
      );

    doc.moveDown(1);

    doc
      .fontSize(18)
      .text(
        `Date: ${new Date(
          registration.event.date
        ).toDateString()}`,
        { align: "center" }
      );

    // ================= QR CODE =================
    const verifyUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/verify-certificate/${registration._id}`;

    const qrImageBuffer = await QRCode.toBuffer(verifyUrl);

    doc.image(qrImageBuffer, doc.page.width - 200, doc.page.height - 200, {
      width: 120,
    });

    doc.end();

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

    const registration = await EventRegistration.findById(registrationId)
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