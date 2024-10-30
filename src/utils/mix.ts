import { randomBytes } from 'crypto';

export const toTitleCase = (str: string): string => {
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};



export const generateFakeEmail = (): string => {
    const nowDate = new Date().getTime();
    return `${nowDate}@fake.com`;1
}

export const generateFakeUsername = (): string => {
    const adjectives = ['awesome', 'cool', 'funny', 'happy', 'sad', 'angry'];
    const nouns = ['gamer', 'coder', 'developer', 'programmer', 'hacker'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);
    const fakeUsername = `${adjective}${noun}${getRandomString(3)}${randomNumber}`;
    return fakeUsername;
  }

  export const getRandomString = (len = 5) => {
    // const length = Math.floor(Math.random() * 5) + 1;
    let randomString = '';
    for (let i = 0; i < len; i++) {
      randomString += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }
    return randomString;
  }
  
  export const toBoolean = (value:any) => {
    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value.toLowerCase() === "yes";
    }
    return Boolean(value); // Handles numbers
}