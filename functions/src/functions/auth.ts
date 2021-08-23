import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from '../constants/storage';

function reportCount(path: string, increment: number = 1) {
	// Update count
	return admin.firestore().collection('stats').doc(path).update({
		'total': admin.firestore.FieldValue.increment(increment),
	}, { exists: true, })
		.catch(err => {
			// Create new count if dosent exist
			admin.firestore().collection('stats').doc(path).set({
				'total': admin.firestore.FieldValue.increment(increment),
			})
		})
}

export const userAdded = functions.firestore.document(COLLS.USER_COLLECTION + '/{userId}')
	.onCreate((snap, context) => reportCount(COLLS.USER_COLLECTION));

export const userRemoved = functions.firestore.document(COLLS.USER_COLLECTION + 'user/{userId}')
	.onDelete((snap, context) => reportCount(COLLS.USER_COLLECTION, -1));

// export const postAdded = functions.firestore.document(COLLS.GROUP_COLLECTION + '/{groupId}/g_posts/{postId}')
// 	.onCreate(async (snap, { params }) => {
// 		// await reportCount('posts', 1);

// 		await admin.firestore().doc(COLLS.GROUP_POST_DOC(params['groupId'], params['postId']))
// 			.update({
// 				'createdAt': admin.firestore.FieldValue.serverTimestamp(),
// 			})
// 	});

// export const postRemoved = functions.firestore.document(COLLS.GROUP_COLLECTION + '/{groupId}/g_posts/{postId}')
// 	.onDelete(async (snap, context) => {
// 		await reportCount('total_posts', -1);
// 	});