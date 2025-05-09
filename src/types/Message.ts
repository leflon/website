export class Message {
	id: string;
	conversationId: string;
	content: string;
	createdAt: number;
	role: 'user' | 'model';
}