const Media = require("../model/media.model");
const { deleteMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  const { mediaIds, postId } = event;

  try {
    logger.info("handlePostDeleted api hit...");

    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    // console.log(("mediaToDelete->", mediaToDelete));

    mediaToDelete.map(async (media) => {
      await deleteMediaToCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      console.log("media->", media);

      logger.info(`Deleted Media _id:${media._id}`);
    });
    logger.info(`Process Delection is Completed with this post id:${postId}`);
  } catch (error) {
    logger.error("Error occured While handlePostDeleted api hit...", error);
    return;
  }
};

module.exports = { handlePostDeleted };
