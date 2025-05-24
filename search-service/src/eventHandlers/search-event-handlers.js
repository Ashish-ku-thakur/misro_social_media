const { invalidateSearchPostCache } = require("../controller/search.controller");
const Search = require("../model/search.model");
const logger = require("../utils/logger");

const handleCreatePost = async (event) => {
  const { postId, userId, content, createdAt } = event;

  // here i have to create search post
  logger.info("handleCreatePost Api Hitting...");
  try {
    const newCreateSearchPost = await Search.create({
      userId,
      postId,
      content,
      createdAt,
    });

    // 🔁 Cache Invalidation
    const fakeReq = { redisClient: global.redisClient }; // or pass your redis client appropriately
    await invalidateSearchPostCache(fakeReq, postId);

    logger.info("new Searchh post created");
  } catch (error) {
    logger.error("Error Occured While handleCreatePost Api Hitting...");
  }
};

const handlePostSearchDeleted = async (event) => {
  const { postId } = event;

  try {
    logger.info("handlePostSearchDeleted api hit...");

    await Search.findByIdAndDelete(postId);

    // 🔁 Cache Invalidation
    const fakeReq = { redisClient: global.redisClient };
    await invalidateSearchPostCache(fakeReq, postId);

    logger.info(
      `Process handlePostSearchDeleted is Completed with this post id:${postId}`
    );
  } catch (error) {
    logger.error(
      "Error occured While handlePostSearchDeleted api hit...",
      error
    );
    return;
  }
};

module.exports = { handleCreatePost, handlePostSearchDeleted };
