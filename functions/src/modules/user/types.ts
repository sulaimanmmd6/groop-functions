export interface UserModel {
	username:string;
	fullName:string;
	bio:string;
	phone?:string;
	searchIndex:Array<string>;
	image?:string;
	pushToken?:string;
}