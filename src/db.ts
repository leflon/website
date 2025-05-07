import { Database } from 'bun:sqlite';
import { Message } from './types/Message';
import { Conversation } from './types/Conversation';

const db = new Database('app.db');
db.exec('PRAGMA journal_mode = WAL;');

const startQuery = db.prepare('INSERT INTO Conversations VALUES (?, ?, ?)');
export function startConversation(token: string): void {
	const now = Date.now();
	startQuery.run(token, now, now);
}

const addMessageQuery = db.prepare('INSERT INTO Messages VALUES (?, ?, ?, ?, ?)');
const updateConversationQuery = db.prepare('UPDATE Conversations SET lastMessageAt = ? WHERE id = ?');
export function appendMessage(conversationId: string, content: string, role: 'user' | 'assistant'): void {
	const now = Date.now();
	addMessageQuery.run(crypto.randomUUID(), conversationId, now, content, role);
	updateConversationQuery.run(now, conversationId);
}

const getConversationQuery = db.prepare('SELECT * FROM Conversations WHERE id = ?').as(Conversation);
export function getConversation(token: string): Conversation | null {
	return getConversationQuery.get(token);
}

const getMesssagesQuery = db.prepare('SELECT * FROM Messages WHERE conversationId = ?').as(Message);
export function getMessages(conversationId: string): Message[] {
	return getMesssagesQuery.all(conversationId);
}
