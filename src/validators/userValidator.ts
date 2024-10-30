import Joi from 'joi';
import { UserRole } from '../models/userModel';

// Define reusable role schemas
const roleSchema = Joi.string().valid(...Object.values(UserRole));
const roleSchemaOptional = roleSchema.optional();

// Base user schema with required fields
const baseUserSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

// Optional fields for base user schema
const baseUserSchemaOptional = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').optional(),
    bio: Joi.string().optional(),
    profilePictureUrl: Joi.string().uri().optional(),
    websiteUrl: Joi.string().uri().optional(),
    phoneNumber: Joi.string().optional(),
});

// Schema for creating a user
export const createUserSchema = baseUserSchema.concat(baseUserSchemaOptional).keys({
    role: roleSchema.required()  // Role is required
});

// Schema for updating a user
export const updateUserSchema = baseUserSchemaOptional.keys({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    role: roleSchemaOptional,
});

// Schema for creating a school
export const createSchoolSchema = baseUserSchema.concat(baseUserSchemaOptional).keys({
    firstName: Joi.any().forbidden(),
    lastName: Joi.any().forbidden(),
    name: Joi.string().required(),  // School must have a name
});

// Schema for updating a school
export const updateSchoolSchema = baseUserSchemaOptional.keys({
    firstName: Joi.any().forbidden(), // Typo fixed here
    lastName: Joi.any().forbidden(),
    name: Joi.string().optional(),  // Name can be updated optionally
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
});

// Schema for creating a student
export const createStudentSchema = baseUserSchemaOptional.keys({
    username: Joi.string().optional(),
    password: Joi.string().optional(),
    rollNumber: Joi.number().integer().min(1).required(),
    class: Joi.number().integer().min(1).max(12).required(),
    section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).required(),
    assessmentYear: Joi.number().integer().min(2019).max(2030).required(),
});

// Schema for updating a student
export const updateStudentSchema = baseUserSchemaOptional.keys({
    // username: Joi.string().optional(),
    // email: Joi.string().email().optional(),
    rollNumber: Joi.number().integer().min(1).optional(),
    class: Joi.number().integer().min(1).max(12).optional(),
    section: Joi.string().valid(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).optional(),
    assessmentYear: Joi.number().integer().min(2019).max(2030).optional(),
});

// Schema for login
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
