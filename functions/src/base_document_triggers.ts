import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

function reportCount(increment: number = 1) {
	return admin.firestore().collection('stats').doc('users').set({
		'total': admin.firestore.FieldValue.increment(increment),
	})
}

export const onUserAdded = functions.firestore.document('user/{userId}')
	.onCreate((snap, context) => reportCount());

export const onUserRemoved = functions.firestore.document('user/{userId}')
	.onDelete((snap, context) => reportCount(-1));