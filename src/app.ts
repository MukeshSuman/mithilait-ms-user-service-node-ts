import express from 'express';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './routes/userRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { connectDB } from './config/database';
import { logger } from './config/logger';

config();

const app = express();

app.use(express.json());

// Connect to MongoDB
connectDB();

// Swagger documentation
app.use('/docs', swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
    return res.send(swaggerUi.generateHTML(await import('../public/swagger.json')));
});

// Routes
app.use('/api/users', userRouter);

// Error handling middleware
app.use(errorHandler);

export { app };