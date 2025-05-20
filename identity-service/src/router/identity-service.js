const express = require("express");
const { registerUser } = require("../controller/identity-controller")

const router = express.Router();

router.post("/register", registerUser);

module.exports = router
