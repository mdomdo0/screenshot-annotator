export default {
	baseUrl: 'https://sk.wikipedia.org',
	outDir: 'out/wikipedia',
	context: { locale: 'sk-SK' },

	shots: [
		{
			name: 'hlavna-stranka',
			url: '/wiki/Hlavná_stránka',
			clip: 'viewport',
			marks: [
				{ el: '.mw-logo', label: 'Logo – návrat na hlavnú stránku' },
				{ role: 'searchbox', pos: 'bottom', label: 'Vyhľadávanie' },
				{ el: '#p-lang-btn, .vector-user-links', pos: 'bottom', label: 'Používateľské odkazy' },
			],
		},
		{
			name: 'vyhladavanie',
			url: '/wiki/Hlavná_stránka',
			steps: [{ fill: 'input[name="search"]', value: 'Tatry', wait: 1500 }],
			clip: 'viewport',
			marks: [
				{ el: 'input[name="search"]', label: 'Hľadaný výraz' },
				{ role: 'listbox', label: 'Návrhy počas písania' },
			],
		},
	],
};
