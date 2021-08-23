// import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.auth = require('./functions/auth');
exports.user = require('./functions/user');
exports.group = require('./functions/group');
exports.post = require('./functions/post');
// exports.file = require('./file');