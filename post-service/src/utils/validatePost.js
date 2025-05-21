const Joi = require("joi");


const validateCreatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().required(),
  });

  return schema.validate(data);
};

module.exports = {validateCreatePost}
