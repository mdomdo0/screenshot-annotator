export default {
	baseUrl: './demo/',
	outDir: 'out/demo',

	shots: [
		{
			name: 'nastavenia',
			url: 'index.html',
			clip: 'main',
			marks: [
				{ role: 'tab', name: 'Všeobecné', label: 'Záložky nastavení' },
				{ el: '#site-name', label: 'Názov webu' },
				{ el: '#email', label: 'E-mail' },
				{ el: '#lang', label: 'Jazyk' },
				{ text: 'Uložiť', label: 'Uloženie zmien' },
				{ el: '#orders', label: 'Prvok v shadow DOM' },
				{ el: '#inner-btn', frame: 'iframe', label: 'Tlačidlo vo vnútri iframe' },
			],
		},
		{
			name: 'pouzivatelia',
			url: 'index.html',
			steps: [{ click: 'role=tab[name="Používatelia"]', wait: 200 }, { hover: 'text=aktívna >> nth=0', wait: 300 }],
			clip: '#users',
			marks: [
				{ text: 'Jana Nováková', closest: 'tr', pos: 'left', label: 'Riadok používateľa' },
				{ el: 'thead', label: 'Hlavička tabuľky' },
				{ el: '.badge', nth: 1, label: 'Stav – po nabehnutí myšou zobrazí nápovedu' },
			],
		},
		{
			name: 'hlavicka',
			url: 'index.html',
			clip: 'header',
			padding: 20,
			marks: [
				{ el: '.logo', pos: 'bottom', label: 'Logo' },
				{ el: 'header nav', pos: 'bottom', label: 'Menu' },
			],
		},
	],
};
