import jwt from 'jsonwebtoken';
import { IUser } from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user: IUser, expiresIn: string = '1h') => {
    const payload = {
        ...user,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET);
};