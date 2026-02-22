import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

/**
 * Generate Certificate PDF (Landscape A4)
 */
export const generateCertificatePDF = async ({
  studentName,
  eventTitle,
  templatePath,
  outputPath,
}) => {
  return new Promise((resolve, reject) => {
    try {
      /* ================= SAFETY CHECKS ================= */

      if (!fs.existsSync(templatePath)) {
        return reject(
          new Error("Certificate template file not found")
        );
      }

      const ext = path.extname(templatePath).toLowerCase();
      const allowed = [".png", ".jpg", ".jpeg"];

      if (!allowed.includes(ext)) {
        return reject(
          new Error(
            "Invalid certificate template format. Use PNG or JPG only."
          )
        );
      }

      /* ================= PDF SETUP ================= */

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      /* ================= BACKGROUND TEMPLATE ================= */

      doc.image(templatePath, 0, 0, {
        width: 842, // A4 landscape width
        height: 595, // A4 landscape height
      });

      /* ================= STUDENT NAME ================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(42)
        .fillColor("#000000")
        .text(studentName, 0, 270, {
          align: "center",
          width: 842,
        });

      /* ================= EVENT TITLE ================= */

      doc
        .font("Helvetica")
        .fontSize(22)
        .fillColor("#000000")
        .text(`For participating in ${eventTitle}`, 0, 330, {
          align: "center",
          width: 842,
        });

      /* ================= ISSUE DATE ================= */

      const issueDate = new Date().toDateString();
      doc
        .fontSize(14)
        .fillColor("#000000")
        .text(`Date: ${issueDate}`, 620, 520);

      /* ================= FINALIZE ================= */

      doc.end();

      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
