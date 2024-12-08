// eslint-disable-next-line no-undef
const socket = io('http://localhost:3090'); // Adjust the URL as needed

let audioContext;
let mediaStream;
let source;
let processor;

document.getElementById('startBtn').addEventListener('click', startPronunciationAssessment);
document.getElementById('stopBtn').addEventListener('click', stopPronunciationAssessment);

socket.on('pronunciationResult', (result) => {
    console.log('Pronunciation Result:', result);
    document.getElementById('result').innerText = JSON.stringify(result, null, 2);
});

function startPronunciationAssessment() {
    const expectedText = document.getElementById('expectedText').value;
    socket.emit('startPronunciationAssessment', { expectedText });

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStream = stream;
            source = audioContext.createMediaStreamSource(stream);
            processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const intData = downsampleBuffer(inputData, audioContext.sampleRate, 16000);
                socket.emit('audioChunk', intData);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        })
        .catch((err) => {
            console.error('Error accessing microphone:', err);
        });
}

function stopPronunciationAssessment() {
    if (processor && source) {
        processor.disconnect();
        source.disconnect();
        processor.onaudioprocess = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    socket.emit('stopPronunciationAssessment');
}

function downsampleBuffer(buffer, sampleRate, outSampleRate) {
    if (outSampleRate === sampleRate) {
        return convertFloat32ToInt16(buffer);
    }
    const sampleRateRatio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        // Use average value of skipped samples
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = Math.min(1, accum / count) * 0x7FFF;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
}

function convertFloat32ToInt16(buffer) {
    const l = buffer.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        result[i] = Math.min(1, buffer[i]) * 0x7FFF;
    }
    return result.buffer;
}
