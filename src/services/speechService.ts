import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import * as fs from "fs";
// @ts-ignore ts
import * as Segment from "segment";
import * as difflib from "difflib";
import _ from "lodash";
// import * as path from 'path';
import { getPath, TEMP_DIR } from '../config';


// temp\en-US_0.wav
export class SpeechService {

    async transcribeAudioFile(filePath: string): Promise<string> {
        return '';
    }

    async pronunciationAssessmentContinuousWithFile(): Promise<any> {
        // provide a WAV file as an example. Replace it with your own.
        // const fullPath = path.join(__dirname, 'temp', 'en-US_0.wav');
        // const filePath = getPath(AUDIO_DIR, fileName);
        const fileName = 'temp/en-US_0.wav';
        const fullPath = getPath(fileName);
        // const fullPath = TEMP_DIR + fileName;
        var audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(fullPath));
        var speechConfig = sdk.SpeechConfig.fromSubscription("787b5cf644594a86ad945315f08bfe59", "eastus");

        var reference_text = "Today was a beautiful day. We had a great time taking a long walk outside in the morning. The countryside was in full bloom, yet the air was crisp and cold. Towards the end of the day, clouds came in, forecasting much needed rain.";
        // create pronunciation assessment config, set grading system, granularity and if enable miscue based on your requirement.
        const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
            reference_text,
            sdk.PronunciationAssessmentGradingSystem.HundredMark,
            sdk.PronunciationAssessmentGranularity.Phoneme,
            true
        );
        pronunciationAssessmentConfig.enableProsodyAssessment = true;

        var language = "en-US";
        speechConfig.speechRecognitionLanguage = language;

        // create the speech recognizer.
        var reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        pronunciationAssessmentConfig.applyTo(reco);

        const scoreNumber: any = {
            accuracyScore: 0,
            fluencyScore: 0,
            compScore: 0,
            prosodyScore: 0,
        };
        const allWords: any[] = [];
        var currentText: any[] = [];
        var startOffset = 0;
        var recognizedWords: any[] = [];
        var fluencyScores: any[] = [];
        var prosodyScores: any[] = [];
        var durations: any[] = [];
        var jo: any = {};

        // Before beginning speech recognition, setup the callbacks to be invoked when an event occurs.

        // The event recognizing signals that an intermediate recognition result is received.
        // You will receive one or more recognizing events as a speech phrase is recognized, with each containing
        // more recognized speech. The event will contain the text for the recognition since the last phrase was recognized.
        reco.recognizing = function (s, e) {
            var str = "(recognizing) Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text;
            console.log(str);
        };

        // The event recognized signals that a final recognition result is received.
        // This is the final event that a phrase has been recognized.
        // For continuous recognition, you will get one recognized event for each phrase recognized.
        reco.recognized = function (s, e) {
            console.log("pronunciation assessment for: ", e.result.text);
            var pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
            console.log(" Accuracy score: ", pronunciation_result.accuracyScore, '\n',
                "pronunciation score: ", pronunciation_result.pronunciationScore, '\n',
                "completeness score : ", pronunciation_result.completenessScore, '\n',
                "fluency score: ", pronunciation_result.fluencyScore
            );

            jo = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
            const nb = jo["NBest"][0];
            startOffset = nb.Words[0].Offset;
            const localtext = _.map(nb.Words, (item: { Word: string; }) => item.Word.toLowerCase());
            currentText = currentText.concat(localtext);
            fluencyScores.push(nb.PronunciationAssessment.FluencyScore);
            prosodyScores.push(nb.PronunciationAssessment.ProsodyScore);
            const isSucceeded = jo.RecognitionStatus === 'Success';
            const nBestWords = jo.NBest[0].Words;
            const durationList: any[] = [];
            _.forEach(nBestWords, (word: { Duration: any; }) => {
                recognizedWords.push(word);
                durationList.push(word.Duration);
            });
            durations.push(_.sum(durationList));

            if (isSucceeded && nBestWords) {
                allWords.push(...nBestWords);
            }
        };

        function calculateOverallPronunciationScore() {
            const resText = currentText.join(" ");
            let wholelyricsArry: any[] = [];
            let resTextArray: any[] = [];

            if (["zh-cn"].includes(language.toLowerCase())) {
                const resTextProcessed = (resText.toLocaleLowerCase() ?? "").replace(new RegExp("[^a-zA-Z0-9\u4E00-\u9FA5']+", "g"), " ");
                const wholelyrics = (reference_text.toLocaleLowerCase() ?? "").replace(new RegExp("[^a-zA-Z0-9\u4E00-\u9FA5']+", "g"), " ");
                const segment = new Segment();
                segment.useDefault();
                segment.loadDict('wildcard.txt');
                _.map(segment.doSegment(wholelyrics, { stripPunctuation: true }), (res: { [x: string]: any; }) => wholelyricsArry.push(res['w']));
                _.map(segment.doSegment(resTextProcessed, { stripPunctuation: true }), (res: { [x: string]: any; }) => resTextArray.push(res['w']));
            } else {
                let resTextProcessed = (resText.toLocaleLowerCase() ?? "").replace(new RegExp("[!\"#$%&()*+,-./:;<=>?@[^_`{|}~]+", "g"), "").replace(new RegExp("]+", "g"), "");
                let wholelyrics = (reference_text.toLocaleLowerCase() ?? "").replace(new RegExp("[!\"#$%&()*+,-./:;<=>?@[^_`{|}~]+", "g"), "").replace(new RegExp("]+", "g"), "");
                wholelyricsArry = wholelyrics.split(" ");
                resTextArray = resTextProcessed.split(" ");
            }
            const wholelyricsArryRes = _.map(
                _.filter(wholelyricsArry, (item: any) => !!item),
                (item: string) => item.trim()
            );

            // For continuous pronunciation assessment mode, the service won't return the words with `Insertion` or `Omission`
            // We need to compare with the reference text after received all recognized words to get these error words.
            const diff = new difflib.SequenceMatcher(null, wholelyricsArryRes, resTextArray);
            const lastWords = [];
            for (const d of diff.getOpcodes()) {
                if (d[0] == "insert" || d[0] == "replace") {
                    if (["zh-cn"].includes(language.toLowerCase())) {
                        for (let j = d[3], count = 0; j < d[4]; count++) {
                            let len = 0;
                            let bfind = false;
                            _.map(allWords, (item: { Word: string | any[]; }, index: number) => {
                                if (
                                    (len == j ||
                                        (index + 1 < allWords.length &&
                                            allWords[index].Word.length > 1 &&
                                            j > len &&
                                            j < len + allWords[index + 1].Word.length)) &&
                                    !bfind
                                ) {
                                    const wordNew = _.cloneDeep(allWords[index]);
                                    if (
                                        allWords &&
                                        allWords.length > 0 &&
                                        allWords[index].PronunciationAssessment.ErrorType !== "Insertion"
                                    ) {
                                        wordNew.PronunciationAssessment.ErrorType = "Insertion";
                                    }
                                    lastWords.push(wordNew);
                                    bfind = true;
                                    j += allWords[index].Word.length;
                                }
                                len = len + item.Word.length;
                            });
                        }
                    } else {
                        for (let j = d[3]; j < d[4]; j++) {
                            if (allWords && allWords.length > 0 && allWords[j].PronunciationAssessment.ErrorType !== "Insertion") {
                                allWords[j].PronunciationAssessment.ErrorType = "Insertion";
                            }
                            lastWords.push(allWords[j]);
                        }
                    }
                }
                if (d[0] == "delete" || d[0] == "replace") {
                    if (
                        d[2] == wholelyricsArryRes.length &&
                        !(
                            jo.RecognitionStatus == "Success" ||
                            jo.RecognitionStatus == "Failed"
                        )
                    )
                        continue;
                    for (let i = d[1]; i < d[2]; i++) {
                        const word = {
                            Word: wholelyricsArryRes[i],
                            PronunciationAssessment: {
                                ErrorType: "Omission",
                            },
                        };
                        lastWords.push(word);
                    }
                }
                if (d[0] == "equal") {
                    for (let k = d[3], count = 0; k < d[4]; count++) {
                        if (["zh-cn"].includes(language.toLowerCase())) {
                            let len = 0;
                            let bfind = false;
                            _.map(allWords, (item: { Word: string | any[]; }, index: any) => {
                                if (len >= k && !bfind) {
                                    if (allWords[index].PronunciationAssessment.ErrorType !== "None") {
                                        allWords[index].PronunciationAssessment.ErrorType = "None";
                                    }
                                    lastWords.push(allWords[index]);
                                    bfind = true;
                                    k += allWords[index].Word.length;
                                }
                                len = len + item.Word.length;
                            });
                        } else {
                            lastWords.push(allWords[k]);
                            k++;
                        }
                    }
                }
            }

            let reference_words = [];
            if (["zh-cn"].includes(language.toLowerCase())) {
                reference_words = allWords;
            } else {
                reference_words = wholelyricsArryRes;
            }

            let recognizedWordsRes = [];
            _.forEach(recognizedWords, (word: { PronunciationAssessment: { ErrorType: string; }; }) => {
                if (word.PronunciationAssessment.ErrorType == "None") {
                    recognizedWordsRes.push(word);
                }
            });

            let compScore = Number(((recognizedWordsRes.length / reference_words.length) * 100).toFixed(0));
            if (compScore > 100) {
                compScore = 100;
            }
            scoreNumber.compScore = compScore;

            const accuracyScores: number[] = [];
            _.forEach(lastWords, (word: { PronunciationAssessment: { ErrorType: string; AccuracyScore: any; }; }) => {
                if (word && word?.PronunciationAssessment?.ErrorType != "Insertion") {
                    accuracyScores.push(Number(word?.PronunciationAssessment.AccuracyScore ?? 0));
                }
            });
            scoreNumber.accuracyScore = Number((_.sum(accuracyScores) / accuracyScores.length).toFixed(0));

            if (startOffset) {
                const sumRes: number[] = [];
                _.forEach(fluencyScores, (x: number, index: any) => {
                    sumRes.push(x * durations[index]);
                });
                scoreNumber.fluencyScore = _.sum(sumRes) / _.sum(durations);
            }
            scoreNumber.prosodyScore = Number((_.sum(prosodyScores) / prosodyScores.length).toFixed(0));

            const sortScore = Object.keys(scoreNumber).sort(function (a, b) {
                return scoreNumber[a] - scoreNumber[b];
            });
            if (
                jo.RecognitionStatus == "Success" ||
                jo.RecognitionStatus == "Failed"
            ) {
                scoreNumber.pronScore = Number(
                    (
                        scoreNumber[sortScore["0"]] * 0.4 +
                        scoreNumber[sortScore["1"]] * 0.2 +
                        scoreNumber[sortScore["2"]] * 0.2 +
                        scoreNumber[sortScore["3"]] * 0.2
                    ).toFixed(0)
                );
            } else {
                scoreNumber.pronScore = Number(
                    (scoreNumber.accuracyScore * 0.5 + scoreNumber.fluencyScore * 0.5).toFixed(0)
                );
            }

            console.log("    Paragraph pronunciation score: ", scoreNumber.pronScore, ", accuracy score: ", scoreNumber.accuracyScore, ", completeness score: ", scoreNumber.compScore, ", fluency score: ", scoreNumber.fluencyScore, ", prosody score: ", scoreNumber.prosodyScore);

            _.forEach(lastWords, (word: { Word: any; PronunciationAssessment: { AccuracyScore: any; ErrorType: any; }; }, ind: number) => {
                console.log("    ", ind + 1, ": word: ", word.Word, "\taccuracy score: ", word.PronunciationAssessment.AccuracyScore, "\terror type: ", word.PronunciationAssessment.ErrorType, ";");
            });

        };

        // The event signals that the service has stopped processing speech.
        // https://docs.microsoft.com/javascript/api/microsoft-cognitiveservices-speech-sdk/speechrecognitioncanceledeventargs?view=azure-node-latest
        // This can happen for two broad classes of reasons.
        // 1. An error is encountered.
        //    In this case the .errorDetails property will contain a textual representation of the error.
        // 2. Speech was detected to have ended.
        //    This can be caused by the end of the specified file being reached, or ~20 seconds of silence from a microphone input.
        reco.canceled = function (s, e) {
            if (e.reason === sdk.CancellationReason.Error) {
                var str = "(cancel) Reason: " + sdk.CancellationReason[e.reason] + ": " + e.errorDetails;
                console.log(str);
            }
            reco.stopContinuousRecognitionAsync();
        };

        // Signals that a new session has started with the speech service
        reco.sessionStarted = function (s, e) { };

        // Signals the end of a session with the speech service.
        reco.sessionStopped = function (s, e) {
            reco.stopContinuousRecognitionAsync();
            reco.close();
            calculateOverallPronunciationScore();
        };

        reco.startContinuousRecognitionAsync();

    };
}

