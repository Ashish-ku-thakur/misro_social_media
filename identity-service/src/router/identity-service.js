const express = require("express");
const { registerUser, loggiUser, refreshTokenUser } = require("../controller/identity-controller")

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loggiUser);
router.post("/me", refreshTokenUser);

module.exports = router
