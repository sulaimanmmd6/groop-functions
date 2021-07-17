// import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Base triggers
import * as baseTriggers from './base_document_triggers';
exports.onUserAdded = baseTriggers.onUserAdded;
exports.onUserRemoved = baseTriggers.onUserRemoved;

// User functions
exports.user = require('./user_functions');