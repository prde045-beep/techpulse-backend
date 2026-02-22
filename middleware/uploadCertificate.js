import multer from "multer";
import path from "path";
import fs from "fs";

// ================= UPLOAD DIRECTORY =================
const uploadDir = "uploads/certificates";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= STORAGE CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `certificate-${unique}${path.extname(file.originalname)}`
    );
  },
});

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"), false);
  } else {
    cb(null, true);
  }
};

// ================= EXPORT MIDDLEWARE =================
const uploadCertificate = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default uploadCertificate;
