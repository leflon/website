import { GoogleGenAI } from '@google/genai';
import { Conversation } from './types/Conversation';

const SYSTEM_PROMPT = await Bun.file('src/system.md').text();

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY
});

export function getResponse(conversation: Conversation, userMessage: string) {
	const contents = conversation.messages.map((msg) => ({
		role: msg.role,
		parts: [{ text: msg.content }]
	}));
	contents.push({
		role: 'user',
		parts: [{ text: userMessage }]
	});
	return ai.models.generateContentStream({
		model: 'gemini-2.0-flash',
		contents: contents,
		config: {
			systemInstruction: SYSTEM_PROMPT
		}
	});
}