import { app } from './app';
// import { logger } from './config/logger';
// import { createServer } from 'http';
// // import { WebSocketServer } from 'ws';
// // import * as WebSocket from 'ws';
// import { Server } from "socket.io";

// // import * as fs from 'fs';
// // import * as path from 'path';
// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
// import dotenv from 'dotenv';
// import _ from 'lodash';

// const server = createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*", // Allow requests from all origins (or specify your frontend URL)
//         methods: ["GET", "POST"],
//     },
// });

// dotenv.config();

// const PORT = process.env.PORT || 3090;

// const speechConfig = sdk.SpeechConfig.fromSubscription(
//     process.env.AZURE_SPEECH_KEY!,
//     process.env.AZURE_SPEECH_REGION!
// );
// speechConfig.speechRecognitionLanguage = "en-US";

// // const saveRecording = (data: any, cb?: (fileName: string, error?: any) => void) => {
// //     const audioData = data;
// //     const fileName = `recording_${Date.now()}.wav`;
// //     const filePath = path.join(__dirname, '../upload', fileName);

// //     fs.writeFile(filePath, audioData, 'base64', (err) => {
// //         if (err) {
// //             console.error('Error saving file:', err);
// //             if (cb) {
// //                 cb('', err);
// //             }
// //             // ws.send('Error saving recording');
// //         } else {
// //             console.log('Recording saved:', fileName);
// //             if (cb) {
// //                 cb(fileName, null);
// //             }
// //             // ws.send(`Recording saved: ${fileName}`);
// //         }
// //     });
// // };

// // wss.on('connection', (ws: WebSocket) => {
// //     console.log('Client connected');
// //     let pushStream: sdk.PushAudioInputStream;
// //     let audioConfig: sdk.AudioConfig;
// //     let pronunciationAssessmentConfig: sdk.PronunciationAssessmentConfig;
// //     let recognizer: sdk.SpeechRecognizer;
// //     let count = 1;
// //     ws.on('message', async (message: Buffer) => {
// //         count++;
// //         console.log(`Received message => ${count}`);
// //         const data = message.toString();
// //         if (data === 'ping') {
// //             ws.send('pong');
// //         } else if (data.startsWith('START_ASSESSMENT:')) {
// //             console.log('Start assessment');
// //             const referenceText = data.slice(17);
// //             pushStream = sdk.PushAudioInputStream.createPushStream();
// //             audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
// //             pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
// //                 referenceText,
// //                 sdk.PronunciationAssessmentGradingSystem.HundredMark,
// //                 sdk.PronunciationAssessmentGranularity.Word,
// //                 true
// //             );
// //             pronunciationAssessmentConfig.enableProsodyAssessment = true;

// //             const language = "en-US";
// //             speechConfig.speechRecognitionLanguage = language;

// //             recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

// //             recognizer.recognizing = (s, e: sdk.SpeechRecognitionEventArgs) => {
// //                 var str = "(recognizing) Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text;
// //                 console.log(str);
// //                 console.log('Recognized: Listen for final recognition results');
// //                 if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
// //                     const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
// //                     console.log(`(recognizing) Pronunciation score: ${pronunciationResult}`);
// //                     // ws.send(JSON.stringify({
// //                     //     recognizedText: e.result.text,
// //                     //     pronunciationScore: pronunciationResult.pronunciationScore,
// //                     //     accuracyScore: pronunciationResult.accuracyScore,
// //                     //     fluencyScore: pronunciationResult.fluencyScore,
// //                     //     completenessScore: pronunciationResult.completenessScore,
// //                     //     type: 'final'
// //                     // }));
// //                 } else {
// //                     console.log('Not recognized.', e.result.text, e.result.reason, e.result.errorDetails);
// //                     // ws.send(JSON.stringify({ error: 'Speech not recognized' }));
// //                 }
// //                 // console.log('Recognized sender:', s);
// //                 console.log('Recognized event:', e.result);
// //                 // const assessment = JSON.parse(recognitionEventArgs.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
// //                 var result = e.result;
// //                 console.log(`(recognizing) Reason: ${sdk.ResultReason[result.reason]}`
// //                     + ` Text: ${result.text}\r\n`);
// //                 ws.send(JSON.stringify({
// //                     type: 'interim',
// //                     // assessment,
// //                     transcription: `${result.text} [...]\r\n`
// //                 }));
// //             };

// //             // recognizer.recognized = null

// //             recognizer.recognized = (s, e: sdk.SpeechRecognitionEventArgs) => {
// //                 // console.log('Recognized sender:', s);
// //                 console.log('Recognized event:', e.result);
// //                 // const assessment = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
// //                 ws.send(JSON.stringify({
// //                     type: 'final',
// //                     // assessment,
// //                     transcription: e.result.text
// //                 }));
// //             };

// //             recognizer.canceled = (s, e) => {
// //                 console.log('Canceled:', e.errorDetails);
// //                 // ws.send(JSON.stringify({ error: `Recognition canceled: ${e.errorDetails}` }));
// //                 recognizer.stopContinuousRecognitionAsync();
// //             };

// //             recognizer.sessionStarted = (s, e) => {
// //                 console.log('Session started');
// //                 console.log(`(sessionStarted) SessionId: ${e.sessionId}\r\n`);
// //                 ws.send(JSON.stringify({
// //                     type: 'sessionStarted',
// //                     referenceText
// //                 }));
// //             };

// //             recognizer.sessionStopped = (s, e) => {
// //                 console.log('Session stopped');
// //                 console.log(`(sessionStopped) SessionId: ${e.sessionId}\r\n`);
// //                 ws.send(JSON.stringify({
// //                     type: 'sessionStopped',
// //                     referenceText
// //                 }));
// //             };
// //             pronunciationAssessmentConfig.applyTo(recognizer);
// //             await recognizer.startContinuousRecognitionAsync();
// //         } else if (data.startsWith('AUDIO:')) {
// //             console.log('Audio data received');
// //             saveRecording(data, (fileName) => {
// //                 console.log('Recording saved:', fileName);
// //                 // ws.send(`Recording saved: ${fileName}`);
// //             });
// //             const audioData = Buffer.from(data.slice(6), 'base64');
// //             pushStream.write(audioData);
// //         } else if (data === 'STOP_ASSESSMENT') {
// //             if (recognizer) {
// //                 await recognizer.stopContinuousRecognitionAsync();
// //                 recognizer.close();
// //             }
// //         } else if (data.startsWith('RECORDING:')) {
// //             const audioData = data.slice(10);
// //             // saveRecording(audioData, (fileName) => {
// //             //     ws.send(`Recording saved: ${fileName}`);
// //             // });
// //             const fileName = `recording_${Date.now()}.wav`;
// //             const filePath = path.join(__dirname, '../upload', fileName);

// //             fs.writeFile(filePath, audioData, 'base64', (err) => {
// //                 if (err) {
// //                     console.error('Error saving file:', err);
// //                     ws.send('Error saving recording');
// //                 } else {
// //                     console.log('Recording saved:', fileName);
// //                     ws.send(`Recording saved: ${fileName}`);
// //                 }
// //             });
// //         } else if (data.startsWith('ASSESS_FILE:')) {
// //             const [fileName, referenceText] = data.slice(12).split('|');
// //             const filePath = path.join(__dirname, '../upload', fileName);
// //             // pronunciationAssessmentFromFile(filePath, referenceText, ws);
// //         }
// //     });

// //     ws.on('close', () => {
// //         console.log('Client disconnected');
// //         if (recognizer) {
// //             recognizer.stopContinuousRecognitionAsync();
// //             recognizer.close();
// //             // .then(() => {

// //             // })
// //             // .catch((error) => {
// //             //     console.error('Error stopping recognition:', error);
// //             // });
// //         }
// //     });
// // });

// // wss.on('connection', (ws) => {
// //     console.log('Client connected');

// //     ws.on('message', (message) => {
// //         console.log(`Received message => ${message}`);
// //         // Handle incoming message from client
// //     });

// //     ws.on('close', () => {
// //         console.log('Client disconnected');
// //     });
// // });

// server.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//     logger.info(`Server is running on port ${PORT}`);
// });

// // app.listen(PORT, () => {
// //     logger.info(`Server is running on port ${PORT}`);
// // });

// import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Azure Speech SDK configuration
// const speechKey = process.env.AZURE_SPEECH_KEY || "YOUR_AZURE_SPEECH_KEY";
// const speechRegion = process.env.AZURE_SPEECH_REGION || "YOUR_AZURE_REGION";

// // Initialize Express and HTTP server
// // const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*", // Allow requests from all origins (or specify your frontend URL)
//         methods: ["GET", "POST"],
//     },
// });

// // Pronunciation Assessment config
// const pronunciationConfig = sdk.PronunciationAssessmentConfig.fromJSON(
//     JSON.stringify({
//         gradingSystem: "HundredMark",
//         granularity: "Phoneme",
//         enableMiscue: true,
//     })
// );
// const pushStream = sdk.AudioInputStream.createPushStream();
// io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     // Receive audio stream from the client
//     socket.on("audio-stream", (audioBuffer) => {

//         pushStream.write(audioBuffer);
//         // pushStream.close();

//         const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
//         const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
//         const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

//         pronunciationConfig.applyTo(recognizer);

//         recognizer.recognizeOnceAsync((result) => {
//             if (result.reason === sdk.ResultReason.RecognizedSpeech) {
//                 console.log("Recognized Speech:", result.text);
//                 // Send recognized text and pronunciation assessment result back to client
//                 socket.emit("speech-recognized", {
//                     text: result.text,
//                     pronunciationAssessment: JSON.parse(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)),
//                 });
//             } else {
//                 console.error("Speech not recognized:", result.errorDetails);
//                 socket.emit("error", result.errorDetails);
//             }
//         });
//     });

//     socket.on("disconnect", () => {
//         console.log("User disconnected:", socket.id);
//         pushStream.close();
//     });
// });

// const PORT = process.env.PORT || 3090;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


// const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow requests from all origins (adjust for production)
        methods: ['GET', 'POST'],
    },
});

// Azure Speech SDK credentials
const speechKey = process.env.AZURE_SPEECH_KEY || 'YOUR_AZURE_SPEECH_KEY';
const speechRegion = process.env.AZURE_SPEECH_REGION || 'YOUR_AZURE_REGION';

interface RecognizerInfo {
    recognizer: sdk.SpeechRecognizer;
    pushStream: sdk.PushAudioInputStream;
}

const recognizerMap = new Map<string, RecognizerInfo>();

io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('startPronunciationAssessment', (data) => {
        const { expectedText } = data;
        startPronunciationAssessment(socket, expectedText);
    });

    socket.on('audioChunk', (audioData: ArrayBuffer) => {
        if (recognizerMap.has(socket.id)) {
            const { pushStream } = recognizerMap.get(socket.id)!;
            const buffer = Buffer.from(new Uint8Array(audioData));
            pushStream.write(buffer);
        }
    });

    socket.on('stopPronunciationAssessment', () => {
        stopPronunciationAssessment(socket);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        stopPronunciationAssessment(socket);
    });
});

function startPronunciationAssessment(socket: Socket, expectedText: string) {
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'en-US'; // Set as needed

    const pushStream = sdk.AudioInputStream.createPushStream();
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        expectedText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true
    );
    pronunciationConfig.applyTo(recognizer);

    // Real-time recognition event listener
    recognizer.recognizing = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
            console.log(`Recognizing: ${e.result.text}`);
            socket.emit('recognizingText', e.result.text); // Emit recognized text in real-time
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
            console.log('No speech recognized.');
        }
    };

    recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            const jsonResult = e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
            const pronunciationResult = JSON.parse(jsonResult);
            socket.emit('pronunciationResult', pronunciationResult);
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
            console.log('No speech recognized.');
        }
    };

    recognizer.canceled = (s, e) => {
        console.error(`Recognition canceled: ${e.errorDetails}`);
        stopPronunciationAssessment(socket);
    };

    recognizer.sessionStopped = () => {
        console.log('Session stopped.');
        stopPronunciationAssessment(socket);
    };

    recognizer.startContinuousRecognitionAsync();

    recognizerMap.set(socket.id, { recognizer, pushStream });
}

function stopPronunciationAssessment(socket: Socket) {
    const recognizerInfo = recognizerMap.get(socket.id);
    if (recognizerInfo) {
        recognizerInfo.pushStream.close();
        recognizerInfo.recognizer.stopContinuousRecognitionAsync(
            () => recognizerInfo.recognizer.close(),
            (err) => console.error('Error stopping recognition:', err)
        );
        recognizerMap.delete(socket.id);
    }
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
