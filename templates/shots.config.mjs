export default {
	baseUrl: 'https://www.example.com',
	viewport: { width: 1440, height: 900 },
	scale: 2,
	format: 'png',
	outDir: 'out',

	loginUrl: '/login',

	hide: [],

	shots: [
		{
			name: 'uvodna-stranka',
			url: '/',
			clip: 'viewport',
			marks: [
				{ el: 'header a', label: 'Logo – odkaz na úvodnú stránku' },
				{ el: 'nav', pos: 'bottom', label: 'Hlavné menu' },
				{ role: 'link', name: 'Kontakt', label: 'Kontakt' },
			],
		},
		{
			name: 'formular',
			url: '/kontakt',
			steps: [{ fill: 'input[type="email"]', value: 'jana@example.com' }],
			clip: 'form',
			marks: [
				{ el: 'input[type="email"]', label: 'E-mail' },
				{ text: 'Odoslať', label: 'Odoslanie formulára' },
			],
		},
		{
			name: 'moj-ucet',
			url: '/account',
			auth: true,
			clip: 'main',
			marks: [{ el: 'main h1', label: 'Názov stránky' }],
		},
	],
};
