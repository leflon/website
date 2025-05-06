import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import { Conversation } from './types/Conversation';
import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import { Message } from './types/Message';

dotenv.config();

const app = express();
const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const SYSTEM_PROMPT = readFileSync(path.join(__dirname, 'system.md'), 'utf-8');

const conversations: Record<string, Conversation> = {};

app.get('/', (req, res) => {
    const token = crypto.randomUUID();
    conversations[token] = {
        id: token,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messages: [
            {
                content: SYSTEM_PROMPT,
                role: 'system',
            },
        ],
    };
    console.log('Conversation started:', token);
    res.render('index', { token });
});

app.post('/api/message', async (req, res) => {
    const { token, message } = req.body;
    if (!token || !message)
        return void res.status(400).json({ error: 'Token and message are required' });
    if (!conversations[token])
        return void res.status(404).json({ error: 'Conversation not found' });
    const conversation = conversations[token];
    conversation.messages.push({
        content: message,
        role: 'user'
    });
    conversation.lastMessageAt = new Date();
    const completion = await mistral.chat.stream({
        messages: conversation.messages,
        model: 'mistral-large-latest',
    });
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    console.log('Streaming a response for conversation', token);
    const reply: Message = {
        content: '',
        role: 'assistant',
    }
    for await (const chunk of completion) {
        if (chunk.data.choices[0].delta.content) {
            const text = chunk.data.choices[0].delta.content as string;
            reply.content += text;
            res.write(text);
        }
    }
    res.end();
    conversation.messages.push(reply);
    conversation.lastMessageAt = new Date();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on :${PORT}`);
});