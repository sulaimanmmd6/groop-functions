import { BaseModel } from "./base_model";

export interface Group extends BaseModel {
	id: string;
	creatorId: string;
	creatorType: string;
	type: string;
	image: string;
	title: string;
	description: string;
}

export interface GroupUser extends BaseModel {
	uid: string,
	gid: string,
	isAdmin: Boolean,
	status: 'REQUESTED' | 'ACCEPTED',
}

export interface UserGroup extends BaseModel {
	gid: string,
	uid: string,
	isOwner: Boolean,
	status: 'REQUESTED' | 'ACCEPTED',
}