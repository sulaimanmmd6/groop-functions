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

	async sendNotification(id: string, notification: NotificationModel) {

		// Find sender user
		var senderUser: UserModel | null = null;

		senderUser = await UserService.getInstance().getById(notification.sid);

		// Find reciever 
		var receiverUser = await UserService.getInstance().getById(notification.toid);

		if (!senderUser || !receiverUser?.pushToken) return;

		// update sender image
		admin.firestore().collection(COLLS.NOTIFICATION).doc(id).update({
			senderImag: notification.senderImag || senderUser?.image,
			seen: false,
		})

		// Send notification
		return sender.send({
			data: {
				...notification,
				senderImag: notification.senderImag || senderUser?.image,
			},
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