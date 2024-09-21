import jwt from 'jsonwebtoken';
import { UserRole } from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (userId: string, role: UserRole, expiresIn: string = '1h') => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET);
};