import * as admin from 'firebase-admin';
import { UserModel } from './types';

export class UserService {
	private static instance: UserService;

	private constructor() { }

	public static getInstance(): UserService {
		if (!UserService.instance) {
			UserService.instance = new UserService();
		}

		return UserService.instance;
	}

	get _collection() {
		return admin.firestore().collection('user');
	}

	getById(uid: string): Promise<UserModel | null> {
		return this._collection.doc(uid).get()
			.then(sp => {
				if (sp.exists) return sp.data() as UserModel;
				else return null;
			});
	}
}