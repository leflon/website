import { Mistral } from '@mistralai/mistralai';
import { serve } from 'bun';
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
    development: process.env.NODE_ENV !== 'production',
    routes: {
        '/': Homepage,
        '/static/:file': async (req) => {
            const filename = req.params.file;
            const filePath = `src/client/static/${filename}`
            if (!(await Bun.file(filePath).exists())) {
                return new Response('File not found', { status: 404 });
            }
            const file = Bun.file(filePath);
            const type = file.type;

            return new Response(await file.bytes(), {
                headers: {
                    'Content-Type': type,
                    'Cache-Control': 'public, max-age=31536000',
                }
            });


        },
        '/message': {
            POST: async (req) => {
                console.log('Received message');
                const { message, token } = await req.json();
                if (!token) return new Response('No token provided', { status: 400 });
                if (!message) return new Response('No message provided', { status: 400 });

                let convo = getConversation(token);
                if (!convo) {
                    startConversation(token);
                    convo = getConversation(token)!;
                }
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
                    let usage = 0;
                    const start = Date.now();
                    for await (const chunk of completion) {
                        const content = chunk.data.choices[0].delta.content as string;
                        usage += chunk.data.usage?.totalTokens || 0;
                        if (content) {
                            messsage += content;
                            yield `${content}`;
                        }
                    }
                    console.log(`[${token}] Completion finished (${usage} tokens / ${Date.now() - start}ms)`);
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