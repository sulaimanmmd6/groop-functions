export interface Group {
	id: string;
	creatorId: string;
	creatorType: string;
	type: string;
	image: string;
	title: string;
	description: string;
}

export interface GroupUser {
	id: string,
	isAdmin: Boolean,
}