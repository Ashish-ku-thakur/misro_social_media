const express = require("express");
const { registerUser, loggiUser, refreshTokenUser, logoutUser } = require("../controller/identity-controller")

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loggiUser);
router.post("/refreshtoken", refreshTokenUser);
router.post("/logout", logoutUser);

module.exports = router
