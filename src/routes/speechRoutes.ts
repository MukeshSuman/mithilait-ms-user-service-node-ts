import express from 'express';
import { SpeechController } from '../controllers/speechController';
// import { authMiddleware } from '../middlewares/authMiddleware';
// import { validate } from '../middlewares/validate';
// import { loginSchema } from '../validators/userValidator';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();
const speechController = new SpeechController();

// authMiddleware()

router.get('/transcribe-audio-file', async (req, res, next) => {
  try {
    const result = await speechController.transcribeAudioFile();
    res.json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
});
router.post('/transcribe-audio-file-a', async (req, res, next) => {
  try {
    const result = await speechController.transcribeAudioFileA();
    res.json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
});

export { router as speechRouter };
