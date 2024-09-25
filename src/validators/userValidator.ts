import Joi from 'joi';
import { UserRole } from '../models/userModel';

export const createUserSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').optional(),
    bio: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    websiteUrl: Joi.string().uri().optional(),
    phoneNumber: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(UserRole)).required()
});

export const updateUserSchema = Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').optional(),
    bio: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    websiteUrl: Joi.string().uri().optional(),
    phoneNumber: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(UserRole)).required()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});