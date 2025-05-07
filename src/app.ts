import { Mistral } from '@mistralai/mistralai';
import { serve } from 'bun';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Homepage from './client/index.html';
import { appendMessage, getConversation, startConversation } from './db';

dotenv.config();


const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
});

const PORT = process.env.PORT || 3000;
serve({
    port: PORT,
    development: true,
    routes: {
        '/': Homepage,
        '/token': async (req) => {
            const token = crypto.randomUUID();
            startConversation(token);
            return new Response(token);
        },
        '/message': {
            POST: async (req) => {
                console.log('Received message');
                const { message, token } = await req.json();
                if (!token) return new Response('No token provided', { status: 400 });
                if (!message) return new Response('No message provided', { status: 400 });

                const convo = getConversation(token);
                if (!convo) return new Response('Conversation not found', { status: 404 });
                if (Date.now() - convo.lastMessageAt > 10 * 60 * 1000) return new Response('Conversation expired', { status: 410 });

                appendMessage(token, message, 'user');
                const messages = convo.messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));
                console.log(`[${token}] Completion requested`);
                const completion = await mistral.chat.stream({
                    messages,
                    stream: true,
                    model: 'mistral-large-latest',
                });
                return new Response(async function*() {
                    let messsage = '';
                    for await (const chunk of completion) {
                        const content = chunk.data.choices[0].delta.content as string;
                        if (content) {
                            messsage += content;
                            process.stdout.write(content);
                            yield `${content}`;
                        }
                    }
                    console.log(`[${token}] Completion finished`);
                    appendMessage(token, messsage, 'assistant');
                }, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    }
                });
            }
        }
    }
});