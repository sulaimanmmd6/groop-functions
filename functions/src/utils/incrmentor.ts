import { firestore } from 'firebase-admin';

export const incrementOnTransaction = (
	transaction: firestore.Transaction, 
	docRef: firestore.DocumentReference<firestore.DocumentData>,
	key: string,
	by: number
	) => {
		let update: any = {};
		update[key] = firestore.FieldValue.increment(by);

		return transaction.update(docRef, update);
}