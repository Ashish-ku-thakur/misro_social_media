const express = require("express");
const { createPost } = require("../controller/post-controller");
const authenticateRequest = require("../middleware/authMiddleware");

const router = express.Router(); // ✅ Correct usage

// ✅ Apply authentication middleware to all routes under this router
router.use(authenticateRequest);

// ✅ Routes
router.post("/create-post", createPost);

module.exports = router;
