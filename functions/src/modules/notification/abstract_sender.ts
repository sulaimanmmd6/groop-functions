import { SendOptions } from './types';


export abstract class AbstractSender {
	send(options: SendOptions): Promise<any> { return new Promise((d, r) => { }); }
}