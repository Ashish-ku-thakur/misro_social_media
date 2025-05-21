const Post = require("../model/post.model");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validatePost");

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
const getAllPosts = async (req, res) => {
  logger.info("Get All Post Api hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const casheKey = `post:${page}:${limit}`;
    const cashedPosts = await req.redisClient.get(casheKey);

    if (cashedPosts) {
      return res.status(200).json(JSON.parse(cashedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNumberOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalNumberOfPosts / limit),
      totalPosts: totalNumberOfPosts,
    };

    // save your post to cached
   await req.redisClient.setex(casheKey, 3600, JSON.stringify(result));


    return res.status(200).json({
      message: "get all posts without cashed",
      success: true,
      posts: result,
    });
  } catch (error) {
    console.log(
      `Error occured while hiting the getAllPosts api`,
      error
    );

    logger.error(
      `Error occured while hiting the getAllPosts api`,
      error
    );

    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// get one post by id

// update the post by id

// delete the post

module.exports = { createPost, getAllPosts };
