const express = require("express");
const { createPost, getAllPosts, getPost, deletePost } = require("../controller/post-controller");
const authenticateRequest = require("../middleware/authMiddleware");

const router = express.Router(); // ✅ Correct usage

// ✅ Apply authentication middleware to all routes under this router
router.use(authenticateRequest);

// ✅ Routes
router.post("/create-post", createPost);
router.get("/", getAllPosts);
router.get("/:postId", getPost);
router.delete("/:postId", deletePost);

module.exports = router;
