import * as firebase from 'firebase-admin';
import { FIREBASE_ADMINSDK } from './firebase-adminsdk';

firebase.initializeApp({
  credential: firebase.credential.cert(
    JSON.parse(JSON.stringify(FIREBASE_ADMINSDK)),
  ),
});

export default firebase;
