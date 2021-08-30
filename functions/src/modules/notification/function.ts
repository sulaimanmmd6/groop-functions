import * as functions from 'firebase-functions';
import { NotificationService } from './service';
import { NotificationModel } from './types';


export const send = functions.firestore.document('notification/{notifId}').onCreate(async (sp, context) => {
	let notification = sp.data() as NotificationModel;
	await NotificationService.getInstance().sendNotification(sp.id, notification);
})