import express from 'express';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler';
import { connectDB } from './config/database';
// import { logger } from './config/logger';
import cors from 'cors';
import { requestLogger } from './middlewares';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import { speechRouter } from './routes/speechRoutes';
import { schoolRouter } from './routes/schoolRoutes';
import { studentRouter } from './routes/studentRoutes';
import { examRouter } from './routes/examRoutes';
import { initCronJobs } from './job';
import path from 'path';
import { topicRouter } from './routes/topicRoutes';

config({
  debug: true,
});

console.log('ddd AZURE_SPEECH_REGION', process.env.AZURE_SPEECH_REGION);

const app = express();

// CORS Configuration
const corsOptions: cors.CorsOptions = {
  origin: '*',
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
  maxAge: 600, // 10 minutes
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(requestLogger);

// Serve the uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static downloads
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// Connect to MongoDB
connectDB();

// Swagger documentation
const options = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};

app.use(
  '/docs',
  swaggerUi.serve,
  async (_req: express.Request, res: express.Response) => {
    return res.send(
      swaggerUi.generateHTML(await import('../public/swagger.json'), options)
    );
  }
);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/speech', speechRouter);
app.use('/api/schools', schoolRouter);
app.use('/api/students', studentRouter);
app.use('/api/exams', examRouter);
app.use('/api/topic', topicRouter);

// Error handling middleware
app.use(errorHandler);
initCronJobs();

export { app };
