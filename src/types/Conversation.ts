import { Message } from './Message';

export type Conversation = {
	id: string;
	createdAt: Date;
	lastMessageAt: Date;
	messages: Message[];
}