import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from './constants/storage';

function reportCount(path: string, increment: number = 1) {
	return admin.firestore().collection('stats').doc(path).update({
		'total': admin.firestore.FieldValue.increment(increment),
	})
}

export const onUserAdded = functions.firestore.document(COLLS.USER_COLLECTION + '/{userId}')
	.onCreate((snap, context) => reportCount(COLLS.USER_COLLECTION));

export const onUserRemoved = functions.firestore.document(COLLS.USER_COLLECTION + 'user/{userId}')
	.onDelete((snap, context) => reportCount(COLLS.USER_COLLECTION, -1));