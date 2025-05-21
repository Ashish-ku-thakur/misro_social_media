const Post = require("../model/post.model");
const logger = require("../utils/logger");
const {validateCreatePost} = require("../utils/validatePost")

//create post
const createPost = async (req, res) => {
  logger.info(`Create Api endpoint hit...`);

  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validate Error", error.message);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }
    const { content, mediaIds } = req.body;

    const newlyCreatedPost = await Post.create({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    logger.info(`Post Create successfully`, newlyCreatedPost);

    return res.status(201).json({
      message: "Post created successfully",
      success: true,
      newlyCreatedPost,
    });
  } catch (error) {
    logger.error(`Error occured in Create Post Api`, error.message);

    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

//get all posts

// get one post by id

// update the post by id

// delete the post

module.exports = { createPost };
