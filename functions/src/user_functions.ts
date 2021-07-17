import { https, } from 'firebase-functions';
import * as admin from 'firebase-admin';

let userCollection = admin.firestore().collection('user');

export const register = https.onCall(
	async (data: { username: string, fullName: string }, context) => {
		
		//
		// Check username
		//
		let exists = await userCollection.where('username', '==', data.username)
			.get().then(sp => !!sp.docs.length);

		if (exists) {
			return new https.HttpsError('already-exists', 'Try a another username.');
		}

		//
		// Create User
		//
		if (context.auth)
			return userCollection.doc(context.auth?.uid).set(data);
		else {
			return new https.HttpsError('unauthenticated', 'You need to login by phone firstly.');	
		}
	},
);