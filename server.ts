import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import fs from 'fs';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import path from 'path';
// import { PassThrough } from "stream";

const app = express();
const port = 3091;
const upload = multer({ dest: 'uploads/' });

// Azure Speech Service Configuration
const subscriptionKey = '787b5cf644594a86ad945315f08bfe59';
const serviceRegion = 'eastus'; // e.g., 'eastus'
const referenceText = "Today was a beautiful day. We had a great time taking a long walk outside in the morning. The countryside was in full bloom, yet the air was crisp and cold. Towards the end of the day, clouds came in, forecasting much needed rain.";  // Example reference text

// Serve the client HTML files
app.use(express.static('public'));

// Endpoint for file upload with pronunciation assessment
app.post('/upload', upload.single('audiofile'), (req, res) => {
    if (!req.file) {
        res.send({ success: false, message: 'No file uploaded.' });
        return;
    }
    const audioPath = path.resolve(__dirname, '../uploads/', req.file.filename);
    assessPronunciationFromFile(audioPath, res);
});

// Pronunciation assessment function for file uploads
function assessPronunciationFromFile(audioFilePath: string, res: express.Response) {
    const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

    // Set up pronunciation assessment configuration
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,  // The reference text to assess against
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme
    );

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync(result => {
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
            res.send({
                success: true,
                recognizedText: result.text,
                pronunciationScore: pronunciationResult.pronunciationScore,
                accuracyScore: pronunciationResult.accuracyScore,
                fluencyScore: pronunciationResult.fluencyScore,
                completenessScore: pronunciationResult.completenessScore
            });
        } else {
            res.send({ success: false, message: 'Speech not recognized.' });
        }
        recognizer.close();
    }, error => {
        console.error('Error recognizing speech:', error);
        res.send({ success: false, message: 'Error recognizing speech.' });
        recognizer.close();
    });
}

// HTTP Server for Express
const server = createServer(app);

// WebSocket server for real-time pronunciation assessment
const wss = new WebSocketServer({ server });

// wss.on('connection', (ws) => {
//     console.log('Client connected for real-time pronunciation assessment');

//     ws.on('message', (message) => {
//         console.log('Received message from client:', message);
//         // @ts-ignore
//         assessPronunciationLive(ws);
//     });

//     ws.on('close', () => {
//         console.log('Client disconnected.');
//     });
// });

// wss.on('connection', (ws) => {
//     console.log('Client connected for real-time pronunciation assessment.');
//     let recognizer: sdk.SpeechRecognizer | null = null;

//     ws.on('message', (message) => {
//         const data = JSON.parse(message.toString());

//         if (data.action === 'start') {
//             console.log('Starting real-time recognition');
//             // @ts-ignore
//             assessPronunciationLive(ws, () => recognizer = null);  // Callback to set recognizer to null when done
//         }

//         if (data.action === 'stop') {
//             console.log('Stopping real-time recognition');
//             if (recognizer) {
//                 recognizer.stopContinuousRecognitionAsync();
//                 recognizer.close();
//                 recognizer = null;
//                 ws.send(JSON.stringify({ message: 'Recognition stopped' }));
//             }
//         }
//     });

//     ws.on('close', () => {
//         console.log('Client disconnected.');
//         if (recognizer) {
//             recognizer.stopContinuousRecognitionAsync();
//             recognizer.close();
//             recognizer = null;
//         }
//     });
// });

// wss.on('connection', (ws) => {
//     console.log('Client connected for real-time pronunciation assessment.');

//     const audioStream = new PassThrough();  // Stream to pipe the WebSocket audio data
//     const filePath = path.join(__dirname, 'recordings', `session-${Date.now()}.webm`); // Define file name
//     const fileStream = fs.createWriteStream(filePath);  // Create a write stream for saving the audio

//     const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1); // PCM 16-bit format
//     const pushStream = sdk.AudioInputStream.createPushStream(audioStream);
//     const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

//     const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

//     // Pronunciation assessment configuration
//     const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
//         referenceText,
//         sdk.PronunciationAssessmentGradingSystem.HundredMark,
//         sdk.PronunciationAssessmentGranularity.Phoneme
//     );

//     // const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
//     // const pushStream = sdk.AudioInputStream.createPushStream();
//     // const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

//     const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
//     pronunciationAssessmentConfig.applyTo(recognizer);

//     recognizer.startContinuousRecognitionAsync();

//     recognizer.recognizing = (s, e) => {
//         console.log('Recognizing:', e.result.text);
//         ws.send(JSON.stringify({
//             recognizedText: e.result.text,
//             type: 'intermediate',
//         }));
//     };

//     recognizer.recognized = (s, e) => {
//         if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
//             const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
//             ws.send(JSON.stringify({
//                 recognizedText: e.result.text,
//                 pronunciationScore: pronunciationResult.pronunciationScore,
//                 accuracyScore: pronunciationResult.accuracyScore,
//                 fluencyScore: pronunciationResult.fluencyScore,
//                 completenessScore: pronunciationResult.completenessScore,
//                 type: 'final'
//             }));
//         } else {
//             ws.send(JSON.stringify({ error: 'Speech not recognized' }));
//         }
//     };

//     recognizer.canceled = (s, e) => {
//         ws.send(JSON.stringify({ error: `Recognition canceled: ${e.errorDetails}` }));
//         recognizer.stopContinuousRecognitionAsync();
//     };

//     recognizer.sessionStopped = (s, e) => {
//         recognizer.stopContinuousRecognitionAsync();
//     };

//     // Handle incoming audio data from the WebSocket
//     ws.on('message', (data) => {
//         audioStream.write(data);  // Write audio data to PassThrough stream for Azure Speech SDK
//         fileStream.write(data);   // Write audio data to file for saving the recording
//     });

//     ws.on('close', () => {
//         console.log('Client disconnected.');
//         audioStream.end();  // End the Azure input stream
//         fileStream.end();   // End the file stream and save the file
//         recognizer.stopContinuousRecognitionAsync();
//         recognizer.close();
//         console.log(`Recording saved to: ${filePath}`);
//     });
// });

// // Create the recordings directory if it doesn't exist
// if (!fs.existsSync(path.join(__dirname, 'recordings'))) {
//     fs.mkdirSync(path.join(__dirname, 'recordings'));
// }

wss.on('connection', (ws) => {
    console.log('Client connected for real-time pronunciation assessment.');

    // Create a write stream to save the audio to a file
    const filePath = path.join(__dirname, 'recordings', `session-${Date.now()}.webm`);
    const fileStream = fs.createWriteStream(filePath);

    // Create PushAudioInputStream for Azure Speech SDK
    const pushStream = sdk.AudioInputStream.createPushStream();

    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream); // Correct stream input

    // Pronunciation assessment configuration
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme
    );

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);

    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync();

    // Listen for intermediate results
    recognizer.recognizing = (s, e) => {
        console.log('Recognizing:', e.result.text);
        ws.send(JSON.stringify({
            recognizedText: e.result.text,
            type: 'intermediate',
        }));
    };

    // Listen for final recognition results
    recognizer.recognized = (s, e) => {
        console.log('Recognized: Listen for final recognition results');
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
            ws.send(JSON.stringify({
                recognizedText: e.result.text,
                pronunciationScore: pronunciationResult.pronunciationScore,
                accuracyScore: pronunciationResult.accuracyScore,
                fluencyScore: pronunciationResult.fluencyScore,
                completenessScore: pronunciationResult.completenessScore,
                type: 'final'
            }));
        } else {
            console.log('Not recognized.', e.result.text, e.result.reason, e.result.errorDetails);
            ws.send(JSON.stringify({ error: 'Speech not recognized' }));
        }
    };

    // Handle recognition canceled or errors
    recognizer.canceled = (s, e) => {
        console.log('Canceled:', e.errorDetails);
        ws.send(JSON.stringify({ error: `Recognition canceled: ${e.errorDetails}` }));
        recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
        console.log('Session stopped:', e);
        ws.send(JSON.stringify({ message: 'Session stopped' }));
        recognizer.stopContinuousRecognitionAsync();
    };

    // Handle incoming audio data from the WebSocket
    ws.on('message', (data: Uint8Array) => {
        pushStream.write(data);  // Write audio data to Azure Speech SDK stream
        fileStream.write(data);  // Write audio data to file for saving the recording
    });

    // Handle WebSocket close event
    ws.on('close', () => {
        console.log('Client disconnected.');
        pushStream.close();  // Close the Azure audio stream
        fileStream.end();   // End the file stream and finalize the recording
        recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
        console.log(`Recording saved to: ${filePath}`);
    });
});

// Create the recordings directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'recordings'))) {
    fs.mkdirSync(path.join(__dirname, 'recordings'));
}



// Real-time pronunciation assessment
// function assessPronunciationLive(ws: WebSocket, onStop: () => void) {
//     const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//     const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
//     // const recognizer = new sdk.SpeechRecognizer(speechConfig);

//     // Set up pronunciation assessment configuration
//     const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
//         referenceText,
//         sdk.PronunciationAssessmentGradingSystem.HundredMark,
//         sdk.PronunciationAssessmentGranularity.Phoneme
//     );

//     // Audio configuration - using default microphone
//     // const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

//     const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
//     pronunciationAssessmentConfig.applyTo(recognizer);

//     // pronunciationAssessmentConfig.applyTo(recognizer);

//     recognizer.startContinuousRecognitionAsync();

//     recognizer.recognizing = (s, e) => {
//         ws.send(JSON.stringify({ recognizedText: e.result.text, type: 'intermediate' }));
//     };

//     recognizer.recognized = (s, e) => {
//         if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
//             const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
//             ws.send(JSON.stringify({
//                 recognizedText: e.result.text,
//                 pronunciationScore: pronunciationResult.pronunciationScore,
//                 accuracyScore: pronunciationResult.accuracyScore,
//                 fluencyScore: pronunciationResult.fluencyScore,
//                 completenessScore: pronunciationResult.completenessScore,
//                 type: 'final'
//             }));
//         } else {
//             ws.send(JSON.stringify({ error: 'Speech not recognized' }));
//         }
//     };

//     recognizer.canceled = (s, e) => {
//         console.error('Recognition canceled:', e.errorDetails);
//         ws.send(JSON.stringify({ error: 'Recognition canceled: ' + e.errorDetails }));
//         recognizer.stopContinuousRecognitionAsync();
//         onStop();
//     };

//     recognizer.sessionStopped = (s, e) => {
//         console.log('Session stopped.');
//         recognizer.stopContinuousRecognitionAsync();
//         onStop();
//     };

//     // @ts-ignore
//     ws.on('close', () => {
//         recognizer.stopContinuousRecognitionAsync();
//         recognizer.close();
//         onStop();
//     });
// }

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
