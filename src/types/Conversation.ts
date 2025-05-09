import { readFileSync } from 'fs';
import { getMessages } from '../db';
import { Message } from './Message';


export class Conversation {
	id: string;
	createdAt: number;
	lastMessageAt: number;

	get messages(): Message[] {
		return getMessages(this.id);
	}
}