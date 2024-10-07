import express from 'express';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler';
import { connectDB } from './config/database';
import { logger } from './config/logger';
import cors from 'cors';
import { requestLogger } from "./middlewares";
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import { speechRouter } from "./routes/speechRoutes";

config();

const app = express();

// CORS Configuration
const corsOptions: cors.CorsOptions = {
    // origin:'*',
    // origin: (origin, callback) => {
    //     logger.info(`Request from origin: ${origin}`);
    //     const allowedOrigins = process.env.ALLOWED_ORIGINS
    //         ? process.env.ALLOWED_ORIGINS.split(',')
    //         : ['http://localhost:3000'];
    //     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    //         callback(null, true);
    //     } else {
    //         logger.warn(`CORS blocked request from origin: ${origin}`);
    //         callback(new Error('Not allowed by CORS'));
    //     }
    // },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600 // 10 minutes
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(requestLogger);

// Connect to MongoDB
connectDB();

// Swagger documentation
const options = {
    swaggerOptions: {
        persistAuthorization: true
    }
};

app.use('/docs', swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
    return res.send(swaggerUi.generateHTML(await import('../public/swagger.json'), options));
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/speech', speechRouter);

// Error handling middleware
app.use(errorHandler);

export { app };