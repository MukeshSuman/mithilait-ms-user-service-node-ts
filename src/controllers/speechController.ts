// import { Request } from 'express';
import { SpeechService } from '../services/speechService';
import { ApiResponse } from '../utils/apiResponse';
import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  // Request,
} from 'tsoa';
// import { IUser } from '../models/userModel';

@Route('api/speech')
@Tags('Speech')
export class SpeechController extends Controller {
  private speechService: SpeechService;

  constructor() {
    super();
    this.speechService = new SpeechService();
  }

  @Get('transcribe-audio-file')
  // @Security('jwt')
  public async transcribeAudioFile() // @Request() req: any
  : Promise<ApiResponse<any>> {
    await this.speechService.transcribeAudioFile();
    return new ApiResponse(200, true, 'successful', { pass: 'pass' });
  }

  @Post('transcribe-audio-file-a')
  public async transcribeAudioFileA() // @Request() req: any
  : Promise<ApiResponse<any>> {
    // const result =
    await this.speechService.pronunciationAssessmentContinuousWithFile();
    return new ApiResponse(200, true, 'successful', { pass: 'pass' });
  }
}
