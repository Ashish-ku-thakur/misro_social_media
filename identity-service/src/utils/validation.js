const Joi = require("joi");

const validateRegisterUser = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(5).required(),
  });

  return schema.validate(data);
};

module.exports = {validateRegisterUser}
