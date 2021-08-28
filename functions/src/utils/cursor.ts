import * as admin from 'firebase-admin';

type OnDocCallback = (doc: admin.firestore.DocumentData) => Promise<void>;

export async function runCursor({ collection, orderBy, limit, onDoc, onDone }: {
	// collection name
	collection: string,
	orderBy: string,
	// total documents on each call
	limit: number,
	// on document read
	onDoc: OnDocCallback,
	onDone: Function,
}) {
	let lastDoc: any;
	let lastId = process.env.lastId || null;
	let allowGoAhead = true;

	if (lastId) {
		// Get last document from last killed process
		await admin.firestore().collection(collection).doc(lastId).get()
			.then(sp => {
				if (sp.exists) lastDoc = sp
			})
	}

	// this is a inner function
	// it will be used in while section
	const getDocs = () => {

		let query = admin.firestore().collection(collection).orderBy(orderBy).limit(limit)

		if (lastDoc) {
			// define where to start to read 
			// last doc exists 
			query = query.startAfter(lastDoc)
		}

		return query.get().then(async sp => {

			console.log('cursor fetched ', sp.size, 'docs');
			

			if (sp.docs.length > 0) {

				for (let i = 0; i < sp.docs.length; i++) {
					const doc = sp.docs[i];

					// run onDoc call back
					if (onDoc) await onDoc(doc);
				}

				// define end of this part
				lastDoc = sp.docs[sp.docs.length - 1]
				// continue the cursor
				allowGoAhead = true
			} else {
				// stop cursor if there is not more docs
				allowGoAhead = false;
			}
		}).catch(error => {
			console.log(error);
			throw error;
		})
	}

	while (allowGoAhead) {
		await getDocs();
	}

	onDone();
}