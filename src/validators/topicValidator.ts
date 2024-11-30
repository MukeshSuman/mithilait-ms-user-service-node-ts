import Joi from 'joi';

export const createTopicSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid('Speaking', 'Reading', 'Writing', 'Listening', 'Typing').required(),
    // topic: Joi.string().required(),
    duration: Joi.number().required().optional(),
    class: Joi.number().integer().min(1).max(12).optional(),
    // section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
    isPractice: Joi.boolean().optional()
}).unknown(true);

export const updateTopicSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    type: Joi.string().valid('Speaking', 'Reading', 'Writing', 'Listening', 'Typing').optional(),
    // topic: Joi.string().optional(),
    duration: Joi.number().optional(),
    class: Joi.number().integer().min(1).max(12).optional(),
    // section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
    isPractice: Joi.boolean().optional()
}).unknown(true);