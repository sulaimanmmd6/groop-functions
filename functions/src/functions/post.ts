import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from '../constants/storage';
import { incrementOnTransaction } from '../utils/incrmentor';
import { NotificationService } from '../modules/notification/service';
import { CommentModel, PostModel } from '../types/post';
import { UserService } from '../modules/user/service';
import { runCursor } from '../utils/cursor';
import { Group, GroupUser } from '../types/group';

//
// Send notification for all users group
// when a post added to a group
//
export const onPostAdded = functions.runWith({
	memory: '4GB',
	timeoutSeconds: 540,
}).firestore.document('group/{gid}/g_posts/{pid}')
	.onCreate(async (sp, { params }) => {
		let post = sp.data() as PostModel;
		post.id = params['pid'];
		
		let creator = await UserService.getInstance().getById(post.uid);

		if (!creator) return;

		let group = await admin.firestore().doc(COLLS.GROUP_DOC(post.gid)).get().then(sp => sp.data() as Group);

		await runCursor({
			collection: COLLS.GROUP_USERS_COLLECTION(post.gid),
			limit: 2000,
			orderBy: 'uid',
			onDone: () => { },
			onDoc: async (docSP) => {
				var receiverUser = docSP.data() as GroupUser;

				console.time('send notification ' + receiverUser.uid);

				await NotificationService.getInstance().addNotificationToQueue({
					action: 'GOTO_POST',
					sid: post.uid,
					senderImag: creator?.image || group.image,
					toid: receiverUser.uid,
					title: '',
					subtitle: `${creator?.fullName} posted in group ${group.title}.`,
					data: post,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
				});

				console.timeLog('send notification ' + receiverUser.uid);
			},
		});
	});

export const onCommentAdded = functions.firestore.document('group/{gid}/g_posts/{pid}/p_comments/{cid}')
	.onCreate(async (sp, { params }) => {
		let PostRef = admin.firestore().doc(COLLS.GROUP_POST_DOC(params.gid, params.pid));
		let comment: CommentModel = sp.data() as CommentModel;
		let group = await admin.firestore().doc(COLLS.GROUP_DOC(params.gid)).get().then(sp => sp.data() as Group);

		await admin.firestore().runTransaction(async (t) => {
			await incrementOnTransaction(t, PostRef, 'comments', 1);
		});

		// notify post creator
		NotificationService.getInstance().addNotificationToQueue({
			action: 'GOTO_COMMENT',
			sid: comment.uid,
			toid: comment.creatorId,
			title: '',
			subtitle: `${comment.fullName} commented on your post in group ${group.title}.`,
			data: comment,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	});

export const onCommentRemoved = functions.firestore.document('group/{gid}/g_posts/{pid}/p_comments/{cid}')
	.onDelete((sp, { params }) => {
		let PostRef = admin.firestore().doc(COLLS.GROUP_POST_DOC(params.gid, params.pid));

		return admin.firestore().runTransaction(async (t) => {
			await incrementOnTransaction(t, PostRef, 'comments', -1);
		});
	});

export const toggleLike = functions.https.onCall(
	async ({ postId, groupId, creatorId, fullName, }: { postId: string, groupId: string, creatorId: string, fullName: string, }, { auth }) => {

		let PostRef = admin.firestore().doc(COLLS.GROUP_POST_DOC(groupId, postId));
		let likeRef = admin.firestore().collection(COLLS.GROUP_POST_LIKE_COLLECTION(groupId, postId))
			.doc(auth?.uid!);

		let group = await admin.firestore().doc(COLLS.GROUP_DOC(groupId)).get().then(sp => sp.data() as Group);

		let isLiked = await likeRef.get().then(sp => sp.exists);

		return admin.firestore().runTransaction(async (t) => {

			// Remove Like
			if (isLiked) {
				await t.delete(likeRef);
				await incrementOnTransaction(t, PostRef, 'likes', -1);
			}

			// Add like
			else {
				await t.create(likeRef, { uid: auth?.uid, });
				await incrementOnTransaction(t, PostRef, 'likes', 1);

				// notify post creator
				NotificationService.getInstance().addNotificationToQueue({
					action: 'GOTO_POST',
					sid: auth?.uid!,
					toid: creatorId,
					title: '',
					subtitle: `${fullName} liked your post in group ${group.title}.`,
					data: {
						postId, groupId, creatorId,
					},
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			return !isLiked;
		});

	},
);

export const getLikeStatus = functions.https.onCall(
	async ({ postId, groupId }: { postId: string, groupId: string }, { auth }) => {

		let likeRef = admin.firestore().collection(COLLS.GROUP_POST_LIKE_COLLECTION(groupId, postId))
			.doc(auth?.uid!);

		let isLiked = await likeRef.get().then(sp => sp.exists);

		return isLiked;
	},
);


