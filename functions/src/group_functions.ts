import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from './constants/storage';
import { Group, GroupUser, UserGroup } from './types/group';
import { incrementOnTransaction } from './utils/incrmentor';

let groupCollection = admin.firestore().collection(COLLS.GROUP_COLLECTION);

export const create = functions.https.onCall(
	async (data: Group, { auth }) => {

		if (!auth) {
			return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
		}

		//
		// Create Group
		//
		data.createdAt = admin.firestore.FieldValue.serverTimestamp();
		let createdGroup = await groupCollection.add(data);

		//
		// Refrences
		//
		let creatorGroup = admin.firestore().doc(COLLS.USER_GROUP_DOC(auth.uid, createdGroup.id))
		let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(createdGroup.id))
		let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(createdGroup.id, auth.uid));

		await admin.firestore().runTransaction(async (t) => {
			// Add first user
			let firstUser: GroupUser = {
				status: 'ACCEPTED',
				uid: auth.uid,
				isAdmin: true,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			};
			await t.create(groupUsersDocRef, firstUser)

			// update user count
			await incrementOnTransaction(t, groupDocRef, 'totalUsers', 1);

			// Add created group to creator group list
			let userGroup: UserGroup = {
				status: 'ACCEPTED',
				gid: createdGroup.id,
				isOwner: true,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			};
			await t.create(creatorGroup, userGroup);
		})

		return createdGroup.id;
	},
);