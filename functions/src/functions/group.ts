import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from '../constants/storage';
import { Group, GroupUser, UserGroup } from '../types/group';
import { incrementOnTransaction } from '../utils/incrmentor';
import { NotificationService } from '../modules/notification/service';

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
export const join = functions.https.onCall(async ({ gid, fullName, }: { gid: string, uid: string, fullName: string, }, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(auth.uid, gid))
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, auth.uid));

	let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(gid));
	let group = await groupDocRef.get().then(sp => sp.data() as Group);

	//
	// Check User not added already
	//
	let addedUserSp = await userGroupDocRef.get();

	if (addedUserSp.exists) {
		return new functions.https.HttpsError('already-exists', 'User has been join already.');
	}

	let status: "ACCEPTED" | "REQUESTED" = group.type == 'PUBLIC' ? 'ACCEPTED' : 'REQUESTED';

	return admin.firestore().runTransaction(async (t) => {


		// Add  user to group
		let newUserOfGroup: GroupUser = {
			status: status,
			uid: auth.uid,
			gid: gid,
			isAdmin: false,
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};
		await t.set(groupUsersDocRef, newUserOfGroup)

		// Add created group to user group list
		let userGroup: UserGroup = {
			status: status,
			gid: gid,
			uid: auth.uid,
			isOwner: false,
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};

		await t.set(userGroupDocRef, userGroup);

		if (status == 'ACCEPTED')
			await incrementOnTransaction(t, groupDocRef, 'totalUsers', 1);
	})
		.then(_ => {

			// Inform Group admin
			if (status == 'REQUESTED') {
				NotificationService.getInstance().addNotificationToQueue({
					action: 'GOTO_REQUESTS',
					sid: auth?.uid!,
					toid: group.creatorId,
					title: '',
					subtitle: `Your group ${group.title} recieved a join request.`,
					data: { gid, uid: auth.uid, fullName },
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			} else {
				NotificationService.getInstance().addNotificationToQueue({
					action: 'GOTO_GROUP_PROFILE',
					sid: auth?.uid!,
					toid: group.creatorId,
					title: '',
					subtitle: `${fullName} joined the group ${group.title}.`,
					data: { gid, uid: auth.uid, fullName },
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}


			return groupUsersDocRef.get().then(_ => _.data());
		})
})

//
// ACCEPT JOIN REQUET BY GROUP ADMIN
//
interface AcceptContext { gid: string, uid: string, accepted: Boolean, fullName: string };
export const accept = functions.https.onCall(async ({ gid, uid, accepted, fullName, }: AcceptContext, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(uid, gid))
	let groupDocRef = admin.firestore().doc(COLLS.GROUP_DOC(gid));
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, uid));

	let group = await groupDocRef.get().then(sp => sp.data() as Group);


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
	}).then(_ => {

		// Inform User from request result
		var actionTitle = accepted ? 'accepted' : 'rejected';
		NotificationService.getInstance().addNotificationToQueue({
			action: 'GOTO_GROUP_PROFILE',
			sid: auth?.uid!,
			toid: uid,
			title: '',
			subtitle: `${fullName} ${actionTitle} your join request for group ${group.title}.`,
			data: { gid },
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	});
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
// When a user group cant find its relative group
// it means group has been deleted and this function will be called to remove both user-group and group-user models
//
export const removeDeletedGroupLeftOver = functions.https.onCall(async ({ gid }: { gid: string }, { auth }) => {

	if (!auth) {
		return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
	}

	// let isGroupExist = await admin.firestore().doc(COLLS.GROUP_DOC(gid)).get().then(sp => Object.keys(sp.data() || {}).length);

	// if (!isGroupExist) {
	// 	return new functions.https.HttpsError('failed-precondition', 'Group has not been removed yet.');
	// }

	//
	// Refrences
	//
	let userGroupDocRef = admin.firestore().doc(COLLS.USER_GROUP_DOC(auth.uid, gid))
	let groupUsersDocRef = admin.firestore().doc(COLLS.GROUP_USER_DOC(gid, auth.uid));

	await userGroupDocRef.delete();
	await groupUsersDocRef.delete();

	return true;
});

//
// Delete a group
//
export const remove = functions
	.https.onCall(async ({ gid }: { gid: string }, { auth }) => {

		if (!auth) {
			return new functions.https.HttpsError('unauthenticated', 'You need to login by phone firstly.');
		}

		let creatorId = await admin.firestore().doc(COLLS.GROUP_DOC(gid)).get().then(sp => {
			if (!sp.exists)
				return null;

			return sp.data()!.creatorId as String;
		})

		if (!creatorId || creatorId != auth.uid) {
			return new functions.https.HttpsError('permission-denied', 'You are not the creator of the group.');
		}

		return admin.firestore().doc(COLLS.GROUP_DOC(gid)).delete()
	});