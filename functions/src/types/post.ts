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