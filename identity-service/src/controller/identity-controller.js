const User = require("../model/user.model");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegisterUser } = require("../utils/validation");

// user register
const registerUser = async (req, res) => {
  logger.info("RegisterUser endpoint hit...");
  try {
    const { error } = validateRegisterUser(req.body);

    if (error) {
      logger.warn("Validate Error", error.message);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    const { email, username, password } = req.body;

    let user = await User.findOne({ $or: [{ email, username }] });

    if (user) {
      logger.warn("User already exist");
      return res
        .status(400)
        .json({ message: "User already exist", success: false });
    }
    user = await User.create({
      username,
      email,
      password,
    });

    logger.info("User created successfully", user._id);

    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      message: "User created successfully",
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("RegisterUser error occured", error);

    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// user login

// refresh token

// logout

module.exports = { registerUser };
