import * as crypto from 'crypto';

async function randomString(length: number, chars: string): Promise<string> {
  return new Promise((resolve) => {
    const randomBytes = crypto.randomBytes(length);
    const result = new Array(length);

    let cursor = 0;
    for (let i = 0; i < length; i++) {
      cursor += randomBytes[i];
      result[i] = chars[cursor % chars.length];
    }

    resolve(result.join(''));
  });
}

export default randomString;
