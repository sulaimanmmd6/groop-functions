export const COLLS = {
	//
	// Firestore
	//
	USER_COLLECTION: 'user',
	USER_DOC: (uid:string) => `user/${uid}`,
	USER_GROUPS_COLLECTION: (id: string) => `user/${id}/groups`,
	USER_GROUP_DOC: (uid: string, gid: string) => `user/${uid}/groups/${gid}`,

	GROUP_COLLECTION: 'group',
	GROUP_DOC: (gid:string) => `group/${gid}`,
	GROUP_USERS_COLLECTION: (id: string) => `group/${id}/users`,
	GROUP_USER_DOC: (gid: string, uid: string) => `group/${gid}/users/${uid}`,

	//
	// Firebase Storage
	//
	USER_PHOTO_STORAGE: 'users',
	GROUP_COVER_STORAGE: 'group_covers',
}