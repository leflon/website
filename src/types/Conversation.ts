import { readFileSync } from 'fs';
import { getMessages } from '../db';
import { Message } from './Message';

const SYSTEM_PROMPT = readFileSync('src/system.md', 'utf-8');

export class Conversation {
	id: string;
	createdAt: number;
	lastMessageAt: number;

	get messages(): Message[] {
		const messages = getMessages(this.id);
		messages.unshift({
			id: 'system-prompt',
			conversationId: this.id,
			content: SYSTEM_PROMPT,
			createdAt: this.createdAt,
			role: 'system'
		});
		return messages;
	}
}