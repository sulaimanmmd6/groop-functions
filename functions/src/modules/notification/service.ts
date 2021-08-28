import * as admin from 'firebase-admin';

import { UserService } from "../user/service";
import { NotificationModel } from "./types";
import { COLLS } from '../../constants/storage';
import { OneSignalSender } from './onesignal_sender';
import { UserModel } from '../user/types';

var sender = OneSignalSender.getInstance();

export class NotificationService {
	private static instance: NotificationService;

	private constructor() { }

	public static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}

		return NotificationService.instance;
	}

	async sendNotification(notification: NotificationModel) {

		// Find sender user
		var senderUser: UserModel | null = null;

		senderUser = await UserService.getInstance().getById(notification.sid);

		// Find reciever 
		var receiverUser = await UserService.getInstance().getById(notification.toid);

		if (!senderUser || !receiverUser?.pushToken) return;

		// Send notification
		return sender.send({
			data: notification,
			to: receiverUser.pushToken,
			subtitle: notification.subtitle,
			title: notification.title,
			bigIcon: notification.senderImag || senderUser?.image,
			url: notification.url,
		})
			.catch(console.log);
	}

	addNotificationToQueue(notification: NotificationModel) {
		return admin.firestore().collection(COLLS.NOTIFICATION)
			.add(notification);
	}
}