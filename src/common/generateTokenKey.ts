import * as moment from 'moment';
import randomString from './randomString';
import { ALL_CHARACTERS } from '@src/constants';

async function generateKey(request: any) {
  const generatedString = request.isMobileDevice
    ? `${Math.floor(100000 + Math.random() * 900000)}`
    : await randomString(100, ALL_CHARACTERS);

  return generatedString;
}

async function generateTokenKey(request: any, time: number) {
  const token = await generateKey(request);

  const expireAt = moment();
  expireAt.seconds(expireAt.seconds() + moment.duration(time).asSeconds());

  return { token, expireAt };
}

export default generateTokenKey;
