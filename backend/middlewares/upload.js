import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage with dynamic destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check the route to determine the destination folder
    const isProductUpload = req.originalUrl.includes("/product");
    const uploadPath = isProductUpload
      ? path.join(__dirname, "../public/uploads/products")
      : path.join(__dirname, "../public/uploads/blogs");

    // Create a directory if it doesn't exist (you may need to add fs module for this)
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Use appropriate prefix based on upload type
    const prefix = req.originalUrl.includes("/product") ? "product-" : "blog-";
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
