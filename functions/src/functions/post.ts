import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLS } from '../constants/storage';
import { incrementOnTransaction } from '../utils/incrmentor';
import { NotificationService } from '../modules/notification/service';
import { CommentModel } from '../types/post';


export const onCommentAdded = functions.firestore.document('group/{gid}/g_posts/{pid}/p_comments/{cid}')
	.onCreate(async (sp, { params }) => {
		let PostRef = admin.firestore().doc(COLLS.GROUP_POST_DOC(params.gid, params.pid));
		let comment: CommentModel = sp.data() as CommentModel;

		await admin.firestore().runTransaction(async (t) => {
			await incrementOnTransaction(t, PostRef, 'comments', 1);
		});

		// notify post creator
		NotificationService.getInstance().createNotificationFromUseridAsSender({
			action: 'GOTO_COMMENT',
			sid: comment.uid,
			toid: comment.creatorId,
			title: '',
			subtitle: `${comment.fullName} commented on your post`,
			data: comment,
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
				NotificationService.getInstance().createNotificationFromUseridAsSender({
					action: 'GOTO_POST',
					sid: auth?.uid!,
					toid: creatorId,
					title: '',
					subtitle: `${fullName} liked your post`,
					data: {
						postId, groupId, creatorId,
					},
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


