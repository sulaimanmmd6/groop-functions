import * as admin from 'firebase-admin';

import { UserService } from "../user/service";
import { NotificationModel } from "./types";
import { COLLS } from '../../constants/storage';
import { OneSignalSender } from './onesignal_sender';

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

	async createNotificationFromUseridAsSender(notification: NotificationModel) {

		// Find sender user
		var senderUser = await UserService.getInstance().getById(notification.sid);
		if (!senderUser) return;

		// Find reciever 
		var receiverUser = await UserService.getInstance().getById(notification.toid);
		if (!senderUser || !receiverUser?.pushToken) return;

		// Store notification
		await this.storeNotification(notification);

		// Send notification
		await sender.send({
			data: notification,
			to: receiverUser.pushToken,
			subtitle: notification.subtitle,
			title: notification.title,
			bigIcon: notification.senderImag || senderUser.image,
			url: notification.url,
		});
	}

	private storeNotification(notification: NotificationModel) {
		return admin.firestore().collection(COLLS.NOTIFICATION)
			.add(notification);
	}
}