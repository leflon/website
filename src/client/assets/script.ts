declare const showdown: { Converter: any };
const converter = new showdown.Converter({ openLinksInNewWindow: true });

const CONVERSATION_TOKEN = crypto.randomUUID();

/* DOM Elements */
const input = document.querySelector('.input-container textarea') as HTMLTextAreaElement;
const send = document.querySelector('.input-container button') as HTMLButtonElement;
const appContainer = document.querySelector('.app') as HTMLDivElement;
const chatContainer = document.querySelector('.chat-container') as HTMLDivElement;
const examplePrompts = document.querySelectorAll('.example-prompt') as NodeListOf<HTMLDivElement>;
input.focus();

examplePrompts.forEach(elm => {
	elm.addEventListener('click', () => {
		const prompt = elm.dataset.prompt!;
		input.value = prompt;
		sendMessage();
	});
});

let isFirstMessage = true;
let isSendingDisabled = false;

async function sendMessage() {
	const message = input.value.trim();
	if (!message || isSendingDisabled) return;
	input.value = '';
	isSendingDisabled = true;
	input.disabled = true;

	const userMessage = document.createElement('div');
	userMessage.className = 'message user';
	userMessage.textContent = message;
	chatContainer.appendChild(userMessage);
	// Removes example prompts and moves input container down
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
		body: JSON.stringify({ message, token: CONVERSATION_TOKEN }),
	});
	if (!res.body) {
		assistantMessage.innerHTML = "<span lang='fr'>Le serveur n'a renvoyé aucune réponse.</span>" +
			"<span lang='en'>No response from server.</span>" +
			"<span lang='ko'>서버에서 응답이 없습니다.</span>";
		assistantMessage.classList.add('error');
		return;
	}
	if (res.status === 410) {
		assistantMessage.innerHTML = "<span lang='fr'>Cette conversation a expiré. Veuillez en démarrer une nouvelle.</span>" +
			"<span lang='en'>This conversation has expired. Please start a new one.</span>" +
			"<span lang='ko'>이 대화는 만료되었습니다. 새로 시작하세요.</span>";
		assistantMessage.classList.add('error');
		return;
	}
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let done = false;
	let reply = '';
	while (!done) {
		const { value, done: streamDone } = await reader.read();
		if (value) {
			reply += decoder.decode(value, { stream: true });
			assistantMessage.innerHTML = converter.makeHtml(reply);
			document.scrollingElement!.scrollTop = document.scrollingElement!.scrollHeight;
		}
		done = streamDone;
	}
	assistantMessage.innerHTML = converter.makeHtml(reply);
	document.scrollingElement!.scrollTop = document.scrollingElement!.scrollHeight;
	input.disabled = false;
	isSendingDisabled = false;
	input.focus();
}
send.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});

export {};
