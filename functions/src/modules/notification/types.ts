import { BaseModel } from "../../types/base_model";

export interface SendOptions {
	to: string,
	data: any,
	bigIcon?: string,
	url?: string,
	title?: string,
	subtitle: string,
}

export interface NotificationModel extends BaseModel {
	sid: string,
	toid: string,
	action: 'OPEN_URL' | 'GOTO_COMMENT' | 'GOTO_POST' | 'GOTO_GROUP_PROFILE' | 'GOTO_GROUP_WALL' | 'GOTO_USER_PROFILE' | 'GOTO_MY_PROFILE' | 'GOTO_NOTIFICATIONS' | 'GOTO_REQUESTS' | 'GOTO_HOME',
	subtitle: string,
	title?: string,
	url?: string,
	senderImag?: string,
	data?: any,

	/// This array helps client to show these works in bold style on render time.
	boldWordsInDescription: string[]
}