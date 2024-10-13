import Joi from 'joi';

export const examSchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid('Speaking', 'Reading', 'Writing').required(),
    duration: Joi.number().required(),
    description: Joi.string().optional(),
    class: Joi.number().integer().min(1).max(12).optional(),
    section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
}).unknown(true);