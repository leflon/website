const token = await fetch('/token').then(res => res.text());

/* DOM Elements */
const input = document.querySelector('.input-container textarea') as HTMLTextAreaElement;
const send = document.querySelector('.input-container button') as HTMLButtonElement;
const appContainer = document.querySelector('.app') as HTMLDivElement;
const chatContainer = document.querySelector('.chat-container') as HTMLDivElement;

let isFirstMessage = true;

send.addEventListener('click', async () => {
    const message = input.value.trim();
    if (!message) return;
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = message;
    chatContainer.appendChild(userMessage);
    if (isFirstMessage) {
        appContainer.classList.add('active');
        isFirstMessage = false;
    }
    const assistantMessage = document.createElement('div');
    assistantMessage.className = 'message assistant';
    chatContainer.appendChild(assistantMessage);
    const res = await fetch('/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, token }),
    });
    if (!res.body) {
        assistantMessage.textContent = 'No response from server.';
        return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
            assistantMessage.textContent += decoder.decode(value, { stream: true });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        done = streamDone;
    }
});

export {};