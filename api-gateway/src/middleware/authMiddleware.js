const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const validateToken = async (req, res, next) => {
  logger.info("ValidateToken middleware hit... in api-gateway")
  const authHeader = req.headers["authorization"];
  // console.log("authHeader->", req.headers);
  
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn(
      "Access attempt without valid token in validateToken of api-gateway middleware"
    );

    return res.status(401).json({
      message: "Authentication failed",
      success: false,
    });
  }

  await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(429).json({
        message: "Invalid Token",
        success: false,
      });
    }
    // console.log("User in verify token", user);

    req.user = user;
    next()
  });
};

module.exports ={validateToken}
