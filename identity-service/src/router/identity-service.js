const express = require("express");
const { registerUser, loggiUser } = require("../controller/identity-controller")

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loggiUser);

module.exports = router
