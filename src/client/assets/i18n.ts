const SUPPORTED_LANGUAGES = ['en', 'fr', 'ko'];
const langSelector = document.querySelector('.language-selector') as HTMLDivElement;
const langButtons = document.querySelectorAll('.language-selector button') as NodeListOf<HTMLButtonElement>;
const examplePrompts = document.querySelectorAll('.example-prompt') as NodeListOf<HTMLDivElement>;

function updatePrompts(lang: string) {
	examplePrompts.forEach((prompt) => {
		const locale = prompt.querySelector(`:lang(${lang})`)!.textContent || '';
		prompt.setAttribute('data-prompt', locale);
	});
}

// Detect language from storage or navigator
let userLang = localStorage.getItem('paulleflon:language');
if (!userLang || !SUPPORTED_LANGUAGES.includes(userLang)) {
	userLang = null;
	// Fallback to navigator language
	for (const lang of navigator.languages) {
		const parsed = lang.split('-')[0];
		if (SUPPORTED_LANGUAGES.includes(parsed)) {
			userLang = parsed;
			break;
		}
	}
}
if (!userLang)
	userLang = 'en';

updatePrompts(userLang);
document.documentElement.setAttribute('lang', userLang);
localStorage.setItem('paulleflon:language', userLang);
Array.from(langButtons).find((button) => button.getAttribute('data-lang') === userLang)?.classList.add('selected');


langSelector.addEventListener('click', () => {
	langSelector.classList.toggle('open');
});
langButtons.forEach((button) => {
	button.addEventListener('click', (e) => {
		const selectedLang = button.getAttribute('data-lang');
		if (selectedLang) {
			localStorage.setItem('paulleflon:language', selectedLang);
			document.documentElement.setAttribute('lang', selectedLang);
			langButtons.forEach((btn) => {
				if (btn.getAttribute('data-lang') === selectedLang) btn.classList.add('selected');
				else btn.classList.remove('selected');
			});
			updatePrompts(selectedLang);
		}
	});
});
