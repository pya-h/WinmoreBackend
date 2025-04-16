import * as crypto from 'crypto-js';
import { configDotenv } from 'dotenv';
configDotenv({ path: './.env.prod' });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function encrypt() {
  console.log(process.env.PRIVATE_KEY, process.env.SLOGAN);
  return crypto.AES.encrypt(
    process.env.PRIVATE_KEY,
    process.env.SLOGAN,
  ).toString();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decrypt() {
  return crypto.AES.decrypt(
    process.env.PRIVATE_KEY,
    process.env.SLOGAN,
  ).toString(crypto.enc.Utf8);
}

console.log(decrypt());


export function generateRandomString(length: number, containsAlpha = true, exceptions: string[] = []) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const characters = (containsAlpha ? alpha : '') + '01234567890123456789';

  let code: string;
  do {
    code = containsAlpha
      ? alpha[(Math.random() * characters.length) | 0]
      : '';
    for (let i = code.length; i < length; i++) {
      code += characters[(Math.random() * characters.length) | 0];
    }
  } while (exceptions.includes(code));
  return code;

}