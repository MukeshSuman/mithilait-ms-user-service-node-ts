import Joi from 'joi';

export const createExamSchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid('Speaking', 'Reading', 'Writing', 'Listening', 'Typing').required(),
    topic: Joi.string().required(),
    duration: Joi.number().required(),
    description: Joi.string().optional(),
    class: Joi.number().integer().min(1).max(12),
    section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
    isPractice: Joi.boolean().optional()
}).unknown(true);

export const updateExamSchema = Joi.object({
    title: Joi.string().optional(),
    type: Joi.string().valid('Speaking', 'Reading', 'Writing', 'Listening', 'Typing').optional(),
    topic: Joi.string().optional(),
    duration: Joi.number().optional(),
    description: Joi.string().optional(),
    class: Joi.number().integer().min(1).max(12),
    section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
    isPractice: Joi.boolean().optional()
}).unknown(true);