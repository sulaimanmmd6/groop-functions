import { AbstractSender } from './abstract_sender';
import { Client } from 'onesignal-node';
import { keys } from '../../constants/keys';
import { SendOptions } from './types';

export class OneSignalSender implements AbstractSender {

	private static instance: OneSignalSender;
	private client: Client;

	private constructor(appid: string, apiKey: string) {
		this.client = new Client(appid, apiKey);
	}

	public static getInstance(): OneSignalSender {
		if (!OneSignalSender.instance) {

			OneSignalSender.instance = new OneSignalSender(keys.onesignal_appid, keys.onesignal_apikey);
		}

		return OneSignalSender.instance;
	}

	send(options: SendOptions) {
		return this.client.createNotification({
			include_player_ids: [options.to],
			data: options.data,
			large_icon: options.bigIcon,
			url: options.url,
			headings: { en: options.title },
			contents: { en: options.subtitle }
		});
	}
}