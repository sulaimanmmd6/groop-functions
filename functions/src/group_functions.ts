import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from './constants/storage';
import { Group, GroupUser, UserGroup } from './types/group';
import { incrementOnTransaction } from './utils/incrmentor';

const firebaseTools = require('firebase-tools');

let groupCollection = admin.firestore().collection(COLLS.GROUP_COLLECTION);

//
// CREATE A NEW GROUP
//
export const create = functions.https.onCall(
	async (data: Group, { auth }) => {

		if (!auth) {
			return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
		}

		//
		// Create Group
		//
		data.createdAt = admin.firestore.FieldValue.serverTimestamp();
		data.creatorId = auth.uid;
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
				gid: createdGroup.id,
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
				uid: auth.uid,
				isOwner: true,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			};
			await t.create(creatorGroup, userGroup);
		})

		return createdGroup.id;
	},
);

//
// JOIN REQUET TO A GROUP
//
export const join = functions.https.onCall(async ({ gid, uid, }: { gid: string, uid:string }, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(uid || auth.uid, gid))
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, uid || auth.uid));

	//
	// Check User not added already
	//
	let addedUserSp = await userGroupDocRef.get();

	if(addedUserSp.exists) {
		return new functions.https.HttpsError('already-exists', 'User has been join already.');
	}


	return admin.firestore().runTransaction(async (t) => {
		// Add  user to group
		let newUserOfGroup: GroupUser = {
			status: 'REQUESTED',
			uid: uid || auth.uid,
			gid: gid,
			isAdmin: false,
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};
		await t.set(groupUsersDocRef, newUserOfGroup)

		// Add created group to user group list
		let userGroup: UserGroup = {
			status: 'REQUESTED',
			gid: gid,
			uid: uid || auth.uid,
			isOwner: false,
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};
		await t.set(userGroupDocRef, userGroup);
	})
	.then(_ => {
		return groupUsersDocRef.get().then(_ => _.data());
	})
})

//
// ACCEPT JOIN REQUET BY GROUP ADMIN
//
interface AcceptContext { gid: string, uid: string, accepted: Boolean };
export const accept = functions.https.onCall(({ gid, uid, accepted, }: AcceptContext, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(uid, gid))
	let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(gid))
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, uid));


	return admin.firestore().runTransaction(async (t) => {

		if (accepted) {
			await t.update(groupUsersDocRef, { status: 'ACCEPTED' })
			await t.update(userGroupDocRef, { status: 'ACCEPTED' })
			await incrementOnTransaction(t, groupDocRef, 'totalUsers', 1);
		}

		else {
			await t.delete(groupUsersDocRef)
			await t.delete(userGroupDocRef)
		}
	})
})

//
// Leave a group
//
export const leave = functions.https.onCall(({ gid }: { gid: string }, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(auth.uid, gid))
	let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(gid))
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, auth.uid));


	return admin.firestore().runTransaction(async (t) => {

		await t.delete(groupUsersDocRef)
		await t.delete(userGroupDocRef)
		await incrementOnTransaction(t, groupDocRef, 'totalUsers', -1)

	})

});

//
// Delete a group
//
export const remove = functions
	.runWith({
		timeoutSeconds: 540,
		memory: '2GB'
	})
	.https.onCall(async ({ gid }: { gid: string }, { auth }) => {

		if (!auth) {
			return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
		}

		/**
		 * Initiate a recursive delete of documents at a given path.
		 * 
		 * The calling user must be authenticated and have the custom "admin" attribute
		 * set to true on the auth token.
		 * 
		 * This delete is NOT an atomic operation and it's possible
		 * that it may fail after only deleting some documents.
		 * 
		 * @param {string} data.path the document or collection path to delete.
		 */

		// Run a recursive delete on the given document or collection path.
		// The 'token' must be set in the functions config, and can be generated
		// at the command line by running 'firebase login:ci'.
		return await firebaseTools.firestore
			.delete(COLLS.GROUP_DOC(gid), {
				project: process.env.GCLOUD_PROJECT,
				recursive: true,
				yes: true,
				token: functions.config().fb.token
			});
	});