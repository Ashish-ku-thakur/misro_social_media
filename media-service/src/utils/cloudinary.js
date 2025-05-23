const cloudinary = require("cloudinary").v2;
const { error } = require("winston");
const logger = require("./logger");

cloudinary.config({
  cloud_name: process.env.CLOUD_NMAE,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  const type = file.mimetype.includes("video") ? "video" : "img";
  const cloudinaryResponse = new Promise(async (resolve, reject) => {
    const uploadStream = await cloudinary.uploader.upload_stream(
      {
        folder: `micro_media_${type}`,
        resource_type: "auto",
      },
      (err, result) => {
        if (err) {
          logger.error("Error occured While uploading the file on cld", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });

  return cloudinaryResponse;
};

// todo deleteMediaToCloudinary

module.exports = { cloudinary, uploadMediaToCloudinary };
