const express = require("express");
const { uploadMedia, getAllMedia } = require("../controller/media.controller");
const authenticateRequest = require("../middleware/authMiddleware");
const multer = require("multer");
const logger = require("../utils/logger");

const router = express.Router();

router.use(authenticateRequest);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5mb
  },
}).single("file");

router.post(
  "/create-media",
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer Error While uploading the file", err);

        return res.status(400).json({
          message: "Multer Error While uploading the file",
          success: false,
          error: err.message,
        });
      } else if (err) {
        logger.error("Internal Server Error", err);

        return res.status(500).json({
          message: "Internal Server Error",
          success: false,
          error: err.message,
        });
      }

      if (!req.file) {
        logger.error("file not found in multer middleware");

        return res.status(400).json({
          message: "file not found",
          success: false,
        });
      }

      next();
    });
  },
  uploadMedia
);

router.get("/get", getAllMedia)
module.exports = router;
