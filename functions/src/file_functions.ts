import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// import { COLLS } from './constants/storage';
// import { incrementOnTransaction } from './utils/incrmentor';


export const onCreate = functions.firestore.document('files/{fileId}').onCreate(async (sp, context) => {
	const fileData = sp.data() as any;
	// const timestamp = new Date().getTime();
	const bucket = admin.storage().bucket();
	const fileName = `files/${sp.id}.${fileData.ext}`
	const file = bucket.file(fileName);
	const resumableUpload = await file.createResumableUpload();
	const uploadUrl = resumableUpload[0];

	await admin.firestore().collection('files').doc(sp.id)
		.set({ uploadUrl }, { merge: true });
})

export const newStorageFile = functions.storage.object().onFinalize(async (object) => {
	const filePath = object.name;
	// const extention = filePath?.split('.')[filePath.split('.').length - 1];
	let fileId = filePath?.split('.')[0];
	fileId = fileId?.replace('files/', '');

	await admin.firestore().collection('files').doc(fileId || '')
		.update({ uploadComplete: true });
});