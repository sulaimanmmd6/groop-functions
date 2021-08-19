// import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.crud = require('./base_document_triggers');
exports.user = require('./user_functions');
exports.group = require('./group_functions');
exports.post = require('./post_functions');
// exports.file = require('./file_functions');