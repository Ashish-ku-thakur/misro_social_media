const Post = require("../model/post.model");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validatePost");

async function invalidatePostCache(req, input) {
  try {
    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
      await req.redisClient.del(...keys); // spread keys
      console.log("Cache invalidated for keys:", keys);
    } else {
      console.log("No cache keys matched for invalidation.");
    }

    const singlePostKey = await req.redisClient.keys(`post:${input}`);

    if (singlePostKey.length > 0) {
      await req.redisClient.del(singlePostKey); // spread keys
      console.log("Cache invalidated for keys:", singlePostKey);
    } else {
      console.log("No cache keys matched for invalidation.");
    }
  } catch (error) {
    console.error("Error invalidating cache:", error.message);
  }
}

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

    //afyer the create we have delete the cached
    await invalidatePostCache(req, newlyCreatedPost._id.toString());

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

    const casheKey = `posts:${page}:${limit}`;
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
    console.log(`Error occured while hiting the getAllPosts api`, error);

    logger.error(`Error occured while hiting the getAllPosts api`, error);

    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// get one post by id
const getPost = async (req, res) => {
  logger.info("GetPost Api hit...");

  try {
    const { postId } = req.params;

    if (!postId) {
      logger.warn("Post Id Not Found In GetPost Api");
      return res.status(400).json({
        message: "Post Id Not Found",
        success: false,
      });
    }

    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      return res.status(200).json(JSON.parse(cachedPost));
    }

    const post = await Post.findById(postId);

    if (!post) {
      logger.warn("Post Not Found In GetPost Api");
      return res.status(400).json({
        message: "Post Not Found",
        success: false,
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));

    return res.status(200).json({
      message: "Post Found",
      success: true,
      post,
    });
  } catch (error) {
    logger.error("Error occured while GetPost Apui Hiting...", error);

    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// delete the post
const deletePost = async (req, res) => {
  logger.info("DeletePost Api Hit...");

  try {
    const { postId } = req.params;
    if (!postId) {
      logger.warn("Post ID NOT found in delete post api");
      return res.status(400).json({
        message: "Post Id not Found",
        success: false,
      });
    }

    const post = await Post.findOneAndDelete({
      _id: postId,
      user: req.user.userId,
    });

    if (!post) {
      logger.warn("Post NOT found in delete post api");
      return res.status(400).json({
        message: "Post not Found",
        success: false,
      });
    }

    await invalidatePostCache(req, postId);

    return res.status(200).json({
      message: "delete the post successfully",
      success: true,
    });
  } catch (error) {
    logger.error("Error occered While DeletePost Api Hit", error);
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
