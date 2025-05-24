const Search = require("../model/search.model");
const logger = require("../utils/logger");

async function invalidateSearchPostCache(reqOrClient, input) {
  const client = reqOrClient.redisClient || reqOrClient; // works with both
logger.info(`invalidateSearchPostCache function calling...with the key of ${"searches"}`)
  try {
    const keys = await client.keys("searches:*");
    if (keys.length > 0) {
      await client.del(...keys);
      console.log("Cache invalidated for keys:", keys);
    }

    const singlePostKey = await client.keys(`search:${input}`);
    if (singlePostKey.length > 0) {
      await client.del(...singlePostKey);
      console.log("Cache invalidated for single post key:", singlePostKey);
    }
  } catch (error) {
    console.error("Error invalidating cache:", error.message);
  }
}


const searchPostController = async (req, res) => {
  logger.info("Search Post Controller Api Hitting...");

  try {
    const { query } = req.query;
    const key = `searches:${query}`;
    const cachedSearchData = await req.redisClient.get(key);

    if (cachedSearchData) {
      return res.status(200).json(JSON.parse(cachedSearchData));
    }

    //this is my full text search
    let result = await Search.find({
      $text: { $search: query },
    });

    // if full text search not found any result then rejex find the result
    if (result.length === 0) {
      result = await Search.find({
        content: { $regex: query, $options: "i" },
      });
    }

    await req.redisClient.setex(key, 3600, JSON.stringify(result));

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      "Error Occured While Search Post Controller Api Hitting...",
      error
    );

    return res.status(500).json({
      message: "Error Occured While Search Post Controller Api Hitting...",
      successs: false,
    });
  }
};

module.exports = { searchPostController, invalidateSearchPostCache };
