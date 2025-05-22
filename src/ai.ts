import { GoogleGenAI, Content, Part, GenerateContentResponse, Chat } from '@google/genai';
import { Conversation } from './types/Conversation';

const SYSTEM_PROMPT = await Bun.file('src/system.md').text();

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

// In-memory cache for active chat sessions
const activeChats = new Map<string, Chat>();

export async function getResponse(conversation: Conversation, userMessage: string): Promise<AsyncIterable<GenerateContentResponse>> {
	let chat = activeChats.get(conversation.id);
	if (!chat) {
		console.log(`[${conversation.id}] No active chat session found. Starting new one.`);
		const history: Content[] = [
			{
				role: 'user',
				parts: [{ text: userMessage }] as Part[]
			}];
		chat = ai.chats.create({
			model: 'gemini-2.0-flash',
			history,
			config: {
				systemInstruction: SYSTEM_PROMPT
			}
		});
		activeChats.set(conversation.id, chat);
		console.log(`[${conversation.id}] New chat session started.`);
	} else {
		console.log(`[${conversation.id}] Active chat session found. Reusing.`);
	}
	const result = await chat.sendMessageStream({
		message: userMessage
	});
	console.log(`[${conversation.id}] Message sent to chat session.`);
	return result;
}