// src/types/express.d.ts

import express from 'express';

// Define your User type (or import it from your models)
interface User {
    id: string;
    role: string;
    email: string;
    [key: string]: any;
    // Add other user fields as needed
}

// Extend the Express Request interface to include `user`
declare global {
    namespace Express {
        interface Request {
            user?: User;  // Use the correct type for your user object
        }
    }
}
