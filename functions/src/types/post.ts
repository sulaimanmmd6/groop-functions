import { BaseModel } from "./base_model";

export interface CommentModel extends BaseModel {
	// commenter id
	uid: string
	// post creator id
	creatorId: string

	gid: string
	pid: string
	text: string
	likes: string
	fullName: string
}

export interface PostModel extends BaseModel {
	text: string;
	gid: string;
	uid: string;
	status: 'WAITTING_FOR_MEDIA_UPLOAD' | 'PUBLISHED';
	likes: number;
	comments: number;
	shares: number;
	videoId: string;
}