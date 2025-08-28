const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const createChatSchema = Joi.object({
  isGroup: Joi.boolean().required(),
  name: Joi.when('isGroup', { is: true, then: Joi.string().min(2).max(80).required(), otherwise: Joi.forbidden() }),
  memberIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
});

const sendMessageSchema = Joi.object({
  chatId: Joi.string().hex().length(24).required(),
  text: Joi.string().allow('').max(5000),
  imageUrl: Joi.string().uri().allow('')
}).or('text', 'imageUrl');

module.exports = { registerSchema, loginSchema, createChatSchema, sendMessageSchema };
