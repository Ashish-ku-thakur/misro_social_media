const Media = require("../model/media.model");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

// create media
const uploadMedia = async (req, res) => {
  logger.info("UploadMedia Api Hit...");

  try {
    const media = req.file;
    console.log("req.file->", media);

    if (!media) {
      logger.warn("No file Found While UploadMedia Api Hit");

      return res.status(400).json({
        message: "No file Found",
        success: false,
      });
    }

    // grab the data from the file
    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;
    logger.info(`originalname->${originalname}, mimetype->${mimetype}`);
    logger.info(`uploading satrting on cld...`);

    // get cloudinary secure_url
    const cloudinaryResponse = await uploadMediaToCloudinary(media);

    if (!cloudinaryResponse.secure_url) {
      logger.warn("secure_url not found in uploadMediaToCloudinary function");
      return res.status(400).json({
        message: "secure_url not generated",
        success: false,
      });
    }

    logger.info(
      `cloudinary upload successfully with this pubIdL${cloudinaryResponse.public_id}`
    );
    // create the media
    const newlyCreatedMedia = await Media.create({
      originalname,
      mimetype,
      userId,
      publicId: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    });

    if (!newlyCreatedMedia) {
      logger.warn("newlyCreatedMedia not created");
      return res.status(400).json({
        message: "newlyCreatedMedia not created! please try again",
        success: false,
      });
    }

    return res.status(201).json({
      message: "Media Created Successfully",
      success: true,
      newlyCreatedMedia,
    });
  } catch (error) {
    logger.error("Error occured While UploadMedia Api Hit", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

const getAllMedia = async (req, res) => {
  logger.info("getAllMedia api hiting...");
  try {
    const medias = await Media.find({});
    return res.status(200).json({
      medias,
    });
  } catch (error) {
    logger.error("Error occured While getAllMedia api hiting...", error);

    return res.status(500).json({
      message: "Error occured While getAllMedia api hiting",
      success: false,
    });
  }
};

module.exports = { uploadMedia, getAllMedia };
