import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from './constants/storage';
import { Group, GroupUser } from './types/group';

let groupCollection = admin.firestore().collection(COLLS.GROUP_COLLECTION);

export const create = functions.https.onCall(
	async (data: Group, { auth }) => {

		if (!auth) {
			return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
		}

		//
		// Create Group
		//
		let createdGroup = await groupCollection.add(data);

		//
		// Refrences
		//
		let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(createdGroup.id))
		let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(createdGroup.id, auth.uid));
		// let userGroupCollDocRef = doc(COLLS.USER_GROUP_DOC(group.id, auth.uid));

		await admin.firestore().runTransaction(async (t) => {
			// Add first user
			let firstUser: GroupUser = { id: auth.uid, isAdmin: true, };
			await t.create(groupUsersDocRef, firstUser)

			// update user count
			await t.update(groupDocRef, {
				'totalUsers': admin.firestore.FieldValue.increment(1),
			})
		})

		return createdGroup.id;
	},
);