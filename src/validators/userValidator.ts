import Joi from 'joi';
import { UserRole } from '../models/userModel';

export const createUserSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...Object.values(UserRole)).required(),
});

export const updateUserSchema = Joi.object({
    username: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid(...Object.values(UserRole)),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});