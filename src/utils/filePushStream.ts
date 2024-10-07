// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// pull in the required packages.
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import * as fs from "fs";

function readInt32(fd: number): number {
    const buffer = Buffer.alloc(4);
    const bytesRead = fs.readSync(fd, buffer, 0, 4, null);
    if (bytesRead !== 4) {
        throw new Error(`Error reading 32-bit integer from .wav file header. Expected 4 bytes, got ${bytesRead}`);
    }
    return buffer.readInt32LE(0);
}

function readUInt16(fd: number): number {
    const buffer = Buffer.alloc(2);
    const bytesRead = fs.readSync(fd, buffer, 0, 2, null);
    if (bytesRead !== 2) {
        throw new Error(`Error reading 16-bit unsigned integer from .wav file header. Expected 2 bytes, got ${bytesRead}`);
    }
    return buffer.readUInt16LE(0);
}

function readUInt32(fd: number): number {
    const buffer = Buffer.alloc(4);
    const bytesRead = fs.readSync(fd, buffer, 0, 4, null);
    if (bytesRead !== 4) {
        throw new Error(`Error reading unsigned 32-bit integer from .wav file header. Expected 4 bytes, got ${bytesRead}`);
    }
    return buffer.readUInt32LE(0);
}

function readString(fd: number, length: number): string {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, null);
    if (bytesRead !== length) {
        throw new Error(`Error reading string from .wav file header. Expected ${length} bytes, got ${bytesRead}`);
    }
    return buffer.toString();
}

export const openPushStream = (filename: string): sdk.PushAudioInputStream => {
    // Get the wave header for the file.
    const wavFileHeader = readWavFileHeader(filename);

    let format: sdk.AudioFormatTag;

    switch (wavFileHeader.tag) {
        case 1: // PCM
            format = sdk.AudioFormatTag.PCM;
            break;
        case 6:
            format = sdk.AudioFormatTag.ALaw;
            break;
        case 7:
            format = sdk.AudioFormatTag.MuLaw;
            break;
        default:
            throw new Error(`Wave format ${wavFileHeader.tag} is not supported`);
    }

    // Create the format for PCM Audio.
    const audioFormat = sdk.AudioStreamFormat.getWaveFormat(wavFileHeader.framerate, wavFileHeader.bitsPerSample, wavFileHeader.nChannels, format);

    // Create the push stream we need for the speech sdk.
    const pushStream = sdk.AudioInputStream.createPushStream(audioFormat);

    // Open the file and push it to the push stream.
    // Notice: we skip 44 bytes for the typical wav header.
    fs.createReadStream(filename, { start: 44 }).on('data', (arrayBuffer: any) => {
        pushStream.write(arrayBuffer);
    }).on('end', () => {
        pushStream.close();
    });

    return pushStream;
};

interface WavFileHeader {
    framerate: number;
    bitsPerSample: number;
    nChannels: number;
    tag: number;
}

export const readWavFileHeader = (audioFileName: string): WavFileHeader => {
    const fd = fs.openSync(audioFileName, 'r');

    if (readString(fd, 4) !== "RIFF") {
        throw new Error("Error reading .wav file header. Expected 'RIFF' tag.");
    }
    // File length
    readInt32(fd);
    if (readString(fd, 4) !== "WAVE") {
        throw new Error("Error reading .wav file header. Expected 'WAVE' tag.");
    }
    if (readString(fd, 4) !== "fmt ") {
        throw new Error("Error reading .wav file header. Expected 'fmt ' tag.");
    }
    // Format size
    const formatSize = readInt32(fd);
    if (formatSize > 16) {
        throw new Error(`Error reading .wav file header. Expected format size 16 bytes. Actual size: ${formatSize}`);
    }
    // Format tag
    const tag = readUInt16(fd);
    const nChannels = readUInt16(fd);
    const framerate = readUInt32(fd);
    // Average bytes per second
    readUInt32(fd);
    // Block align
    readUInt16(fd);
    const bitsPerSample = readUInt16(fd);

    fs.closeSync(fd);

    return { framerate, bitsPerSample, nChannels, tag };
};
