const Joi = require("joi");


const validateCreatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().required(),
    mediaIds:Joi.array().optional()
  });

  return schema.validate(data);
};

module.exports = {validateCreatePost}
