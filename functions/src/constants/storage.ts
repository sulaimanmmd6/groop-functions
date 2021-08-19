export const COLLS = {
	//
	// Firestore
	//
	USER_COLLECTION: 'user',
	USER_DOC: (uid: string) => `user/${uid}`,
	USER_GROUPS_COLLECTION: (id: string) => `user/${id}/u_groups`,
	USER_GROUP_DOC: (uid: string, gid: string) => `user/${uid}/u_groups/${gid}`,

	GROUP_COLLECTION: 'group',
	GROUP_DOC: (gid: string) => `group/${gid}`,
	GROUP_USERS_COLLECTION: (id: string) => `group/${id}/g_users`,
	GROUP_USER_DOC: (gid: string, uid: string) => `group/${gid}/g_users/${uid}`,
	GROUP_POST_DOC: (gid: string, pid: string) => `group/${gid}/g_posts/${pid}`,
	GROUP_POST_LIKE_COLLECTION: (gid: string, pid: string) => `group/${gid}/g_posts/${pid}/p_likes`,

	//
	// Firebase Storage
	//
	USER_PHOTO_STORAGE: 'users',
	GROUP_COVER_STORAGE: 'group_covers',
}