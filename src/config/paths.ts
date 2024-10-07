// src/config/paths.ts

import path from 'path';

// Set the root directory to the parent of the 'src' folder
export const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Function to get absolute path from a path relative to the root directory
export function getPath(...relativePath: string[]): string {
    return path.join(ROOT_DIR, ...relativePath);
}

// Common paths
// export const AUDIO_DIR = getPath('audio');
// export const CONFIG_DIR = getPath('config');
// export const UPLOAD_DIR = getPath('uploads');
export const TEMP_DIR = getPath('temp');

// You can add more specific paths as needed