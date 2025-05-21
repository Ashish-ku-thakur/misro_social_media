const RefreshToken = require("../model/refresh-token.model");
const User = require("../model/user.model");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const {
  validateRegisterUser,
  validateLoginUser,
} = require("../utils/validation");

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
const loggiUser = async (req, res) => {
  logger.info(`LogginUser endpoint hit...`);
  try {
    const { error } = validateLoginUser(req.body);

    if (error) {
      logger.error(`Error on Login Validation`, error.details[0].message);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // const customName = req.headers.name
    // console.log("req.headers->", req.headers);

    if (!user) {
      logger.error(`Error on Login api User not Found`);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    // valid password or not
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      logger.error(`Error on Login api Password is nor valid`);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(200).json({
      message: `Welcome back ${user.username}`,
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("LogginUser error occured", error);

    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// refresh token
const refreshTokenUser = async (req, res) => {
  logger.info(`Refresh Api hit...`);

  try {
    const { refreshTokenGetByBody } = req.body;

    if (!refreshTokenGetByBody) {
      logger.warn(`Error in Refresh api refreshToken is missing`);

      return res.status(400).json({
        message: "Refresh token not found",
        success: false,
      });
    }

    const storedToken = await RefreshToken.findOne({
      token: refreshTokenGetByBody,
    }).populate({ path: "user" });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn(`Error in Refresh api storedToken is not matched`);

      return res.status(400).json({
        message: "Refresh token not matched",
        success: false,
      });
    }

    // console.log(storedToken);

    // generate new token
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(storedToken.user);

    // delete the old refresh token
    storedToken.expiresAt = 0;
    await storedToken.save();

    return res.status(200).json({
      message: "RefershToken Generated Successfully",
      success: true,
      user: storedToken.user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.warn(`Refresh Api Error:${error}`);

    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// logout

const logoutUser = async (req, res) => {
  logger.info("LogoutUser endpoint hit...");

  try {
    const { refreshTokenGetByBody } = req.body;

    if (!refreshTokenGetByBody) {
      logger.warn(
        `Error occured in logoutUser refreshtokenGetByBody not found`
      );
      return res.status(400).json({
        message: "refreshtokenGetByBody not found",
        success: false,
      });
    }

    const getTheToken = await RefreshToken.findOne({
      token: refreshTokenGetByBody,
    });

    getTheToken.expiresAt = 0;
    await getTheToken.save();
    logger.info("RefreshToken delete for logout");

    return res.status(200).json({
      message: "User loggout successfully",
      success: true,
    });
  } catch (error) {
    logger.warn("Error occured in LogoutUser endpoint"), error;
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

module.exports = { registerUser, loggiUser, refreshTokenUser, logoutUser };
