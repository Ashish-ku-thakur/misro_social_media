const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../model/refresh-token.model");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "180m" }
  );

  const refreshToken = crypto.randomBytes(20).toString("hex");

  const expiresAt = new Date();

  // expiresAt.setMinutes(expiresAt.getMinutes() + 2);
  // expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(expiresAt.getHours() + 3); // this is for three hour

  // delete old token
  const oldToken = await RefreshToken.findOneAndDelete({ user: user._id });

  // try to delete assesstoken also

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
