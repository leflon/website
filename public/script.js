const form = document.querySelector('form');
console.log('Form:', form);

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Create a new div to stream the response into
    const streamDiv = document.createElement('div');
    document.body.appendChild(streamDiv);

    const action = form.action;
    const formData = new FormData(form);

    // Convert FormData to URLSearchParams for x-www-form-urlencoded
    const body = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        body.append(key, value);
    }

    try {
        const response = await fetch(action, {
            method: form.method || 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!response.body) {
            streamDiv.textContent = 'No stream available.';
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const {value, done: streamDone} = await reader.read();
            if (value) {
                streamDiv.textContent += decoder.decode(value, {stream: true});
            }
            done = streamDone;
        }
    } catch (err) {
        streamDiv.textContent = 'Error: ' + err.message;
    }
});