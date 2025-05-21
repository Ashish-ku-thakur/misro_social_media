const logger = require("../utils/logger");

const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    logger.warn("Access attempted without user ID");

    return res.status(400).json({
      message: "Authencation is required! Please Login",
      success: false,
    });
  }

  req.user = { userId };
  next();
};

module.exports = authenticateRequest
