const hideBethemeNotice = `[...document.querySelectorAll('#wpbody-content div')]
	.filter((d) => /Welcome to Betheme/.test(d.textContent) && d.children.length < 6 && !d.querySelector('.zsl-tab-btn'))
	.forEach((d) => (d.style.display = 'none'))`;

const hideTestingCard = `[...document.querySelectorAll('[data-tab-panel="sync"] .zsl-card')]
	.filter((c) => /Testovanie/.test(c.querySelector('h2')?.textContent || ''))
	.forEach((c) => (c.style.display = 'none'))`;

const openSections = `(() => {
	const d = [...document.querySelectorAll('.zsl-codebook-details')].find((x) => /^sections/.test(x.querySelector('summary').textContent.trim()));
	d.open = true;
	d.id = 'cb-sections';
})()`;

const admin = (extra) => ({ auth: true, viewport: { width: 1456, height: 821 }, ...extra });
const adminTab = (tab) => [{ eval: hideBethemeNotice }, ...(tab ? [{ click: `.zsl-tab-btn[data-tab="${tab}"]`, wait: 400 }] : [])];
const panel = (tab) => `[data-tab-panel="${tab}"]`;

export default {
	baseUrl: 'https://zsl-web.localhost:33001',
	outDir: 'out/zsl',
	loginUrl: '/wp-admin/',
	hide: ['[class*="cacsp"]:not(html):not(body)'],

	shots: [
		admin({
			name: 'admin-nastavenia',
			url: '/wp-admin/admin.php?page=zsl-calendar',
			steps: adminTab(),
			clip: { x: 0, y: 0, width: 960, height: 470 },
			marks: [
				{ el: '#adminmenu a[href*="page=zsl-calendar"]', closest: 'li', label: 'Kalendár' },
				{ el: '.zsl-tabs', label: 'Záložky' },
				{ el: '#zsl_base_url', label: 'API base URL' },
				{ el: '#zsl_username', label: 'Username' },
				{ el: '.zsl-input-lock', label: 'Password' },
				{ el: `${panel('nastavenia')} input[type="submit"]`, label: 'Uložiť' },
				{ el: '#zsl-page-slug', label: 'URL' },
				{ el: '#zsl-page-slug-save', pos: 'bottom', label: 'Uložiť' },
				{ el: '.zsl-icon-btn', label: '↗' },
			],
		}),
		admin({
			name: 'admin-sync',
			url: '/wp-admin/admin.php?page=zsl-calendar',
			steps: [...adminTab('sync'), { eval: hideTestingCard }],
			clip: { x: 0, y: 0, width: 960, height: 465 },
			marks: [
				{ el: '.zsl-tab-btn[data-tab="sync"]', pos: 'top', label: 'Synchronizácia' },
				{ el: '#zsl_sync_time', label: 'Čas' },
				{ el: `${panel('sync')} .zsl-field-note`, label: 'Časové pásmo' },
				{ el: '.zsl-cron-status', label: 'Cron job aktívny' },
				{ el: `${panel('sync')} input[type="submit"]`, label: 'Uložiť' },
				{ el: '#zsl-sync-status-wrap', label: 'Stav synchronizácie' },
				{ el: '#zsl-sync-btn', label: 'Spustiť synchronizáciu teraz' },
			],
		}),
		admin({
			name: 'admin-logy',
			url: '/wp-admin/admin.php?page=zsl-calendar',
			steps: adminTab('logy'),
			clip: { x: 0, y: 0, width: 960, height: 560 },
			marks: [
				{ el: '.zsl-tab-btn[data-tab="logy"]', pos: 'top', label: 'Logy' },
				{ el: `${panel('logy')} thead tr`, label: 'Stĺpce' },
				{ el: `${panel('logy')} tbody tr`, nth: 0, label: 'Úspešná synchronizácia' },
				{ el: `${panel('logy')} tbody tr`, nth: 1, label: 'Synchronizácia s chybou' },
			],
		}),
		admin({
			name: 'admin-data',
			url: '/wp-admin/admin.php?page=zsl-calendar',
			steps: [...adminTab('data'), { waitFor: `${panel('data')} table`, wait: 500 }],
			clip: { x: 0, y: 0, width: 960, height: 395 },
			marks: [
				{ el: '.zsl-tab-btn[data-tab="data"]', pos: 'top', label: 'Dáta' },
				{ el: '#zsl-data-refresh-btn', label: 'Obnoviť' },
				{ el: `${panel('data')} .zsl-subtabs`, label: 'Podzáložky' },
				{ el: `${panel('data')} table`, label: 'Tabuľka' },
				{ el: `${panel('data')} .zsl-page-prev`, closest: 'div', label: 'Stránkovanie' },
			],
		}),
		admin({
			name: 'admin-sections',
			url: '/wp-admin/admin.php?page=zsl-calendar',
			steps: [
				...adminTab('data'),
				{ waitFor: `${panel('data')} table` },
				{ click: '.zsl-subtab-btn[data-subtab="codebooks"]', wait: 300 },
				{ eval: openSections, wait: 200 },
			],
			clip: '#cb-sections',
			padding: 30,
			marks: [
				{ el: '#cb-sections summary', label: 'sections' },
				{ text: 'ZJL', within: '#cb-sections', pos: 'top', label: 'Code' },
			],
		}),
		admin({
			name: 'admin-editor',
			url: '/wp-admin/post.php?post=470&action=edit',
			steps: [{ wait: 1500 }, { dismiss: 'Vitajte v editore', wait: 300 }],
			clip: 'viewport',
			marks: [
				{ el: '[data-type="core/freeform"]', frame: 'iframe[name="editor-canvas"]', label: 'Shortcode v obsahu stránky' },
				{ el: '.mfn-switch-live-editor', pos: 'bottom', label: 'Edit with BeBuilder' },
				{ role: 'button', name: 'Uložiť', exact: true, pos: 'bottom', label: 'Uložiť / Aktualizovať' },
			],
		}),
		admin({
			name: 'admin-bebuilder',
			url: '/wp-admin/post.php?post=470&action=mfn-live-builder',
			steps: [{ waitFor: 'input.mfn-search', wait: 1500 }, { dismiss: 'Fast & intuitive BeBuilder', wait: 300 }, { fill: 'input.mfn-search', value: 'column', wait: 500 }],
			clip: 'viewport',
			marks: [
				{ el: 'input.mfn-search', label: 'Vyhľadanie prvku' },
				{ text: 'Column Text', closest: 'li', label: 'Column Text' },
				{ text: 'Update', pos: 'left', label: 'Update' },
			],
		}),

		{
			name: 'f-list',
			url: '/kalendar/',
			clip: '[data-zsl-calendar]',
			padding: 44,
			marks: [
				{ el: '.zsl-calendar__title', label: 'Nadpis' },
				{ el: '.zsl-calendar__filter-toggle', pos: 'corner', label: 'Filter' },
				{ el: '.zsl-calendar__year .zsl-calendar__dropdown', label: 'Rok' },
				{ el: 'tr[data-zsl-href] .zsl-calendar__ics', pos: 'corner', label: 'ICS' },
				{ el: 'tr[data-zsl-href]', pos: 'left', pad: 2, label: 'Riadok podujatia' },
				{ el: '.zsl-calendar__table thead th:nth-child(7)', pos: 'top', pad: 0, label: 'Pohlavie' },
				{ el: '.zsl-calendar__table thead th:nth-child(8)', pos: 'top', pad: 0, label: 'Prílohy' },
				{ el: '.zsl-calendar__pagination', label: 'Stránkovanie' },
			],
		},
		{
			name: 'f-tooltip',
			url: '/kalendar/',
			steps: [{ hover: '.zsl-calendar__cell--files .zsl-calendar__badge--muted', wait: 400 }],
			clip: '.zsl-calendar__table',
			marks: [
				{ el: 'tr[data-zsl-href] .zsl-calendar__cell--files .zsl-calendar__badges', label: 'Dostupné prílohy' },
				{ el: '.zsl-calendar__cell--files .zsl-calendar__badge--muted', pad: 2, label: 'Nedostupná príloha' },
			],
		},
		{
			name: 'f-filter',
			url: '/kalendar/',
			steps: [{ click: '.zsl-calendar__filter-toggle', wait: 200 }],
			clip: '.zsl-calendar__filter',
			padding: 30,
			marks: [
				...['Odvetvie', 'Disciplína', 'Pohlavie', 'Rok', 'Typ podujatia', 'Kategória', 'Miesto konania'].map((label, nth) => ({
					el: '.zsl-calendar__filter .zsl-calendar__field',
					nth,
					pos: 'corner',
					label,
				})),
				{ el: '.zsl-calendar__button--primary', label: 'Vyhľadať' },
				{ el: '.zsl-calendar__reset', label: 'Zrušiť filtrovanie' },
			],
		},
		{
			name: 'f-dropdown',
			url: '/kalendar/',
			steps: [{ click: '.zsl-calendar__filter-toggle', wait: 200 }, { click: '.zsl-calendar__filter .zsl-calendar__dropdown-toggle', wait: 200 }],
			clip: ['.zsl-calendar__filter', '.zsl-calendar__dropdown-list'],
			padding: 20,
		},
		{
			name: 'f-detail',
			url: '/kalendar/?zsl_race_id=2',
			clip: '.zsl-calendar',
			padding: 44,
			marks: [
				{ el: '.zsl-calendar__back', label: 'späť na kalendár podujatí' },
				{ el: '.zsl-calendar__title', label: 'Názov podujatia' },
				{ el: '.zsl-calendar__panel', nth: 0, pos: 'corner', label: 'Detail podujatia' },
				{ el: '.zsl-calendar__ics-link', label: 'Stiahnuť .ics súbor' },
				{ el: '.zsl-calendar__panel', nth: 1, pos: 'corner', label: 'Súbory na stiahnutie' },
				{ el: '.zsl-calendar__download-button', pos: 'left', label: 'Stiahnuť' },
				{ el: '.zsl-calendar__panel--contacts', pos: 'corner', label: 'Kontakty' },
			],
		},
		{
			name: 'f-download',
			url: '/kalendar/?zsl_race_id=2',
			steps: [{ click: '.zsl-calendar__download-button', wait: 250 }],
			clip: ['.zsl-calendar__files', '.zsl-calendar__download-menu'],
			padding: 30,
		},
		{
			name: 'f-mobile',
			url: '/kalendar/',
			viewport: { width: 390, height: 844 },
			clip: '[data-zsl-calendar]',
			padding: 20,
		},
		{
			name: 'f-embedded',
			url: '/zjazdove-test/',
			steps: [{ click: '.zsl-calendar__filter-toggle', wait: 200 }],
			clip: '[data-zsl-calendar]',
			padding: 44,
			marks: [
				{ el: '.zsl-calendar__title', label: 'Nadpis' },
				{ el: '.zsl-calendar__filter .zsl-calendar__field', pos: 'corner', label: 'Predvyplnený filter' },
				{ el: '.zsl-calendar__reset', label: 'Zrušiť filtrovanie' },
				{ el: 'tr[data-zsl-href]', pos: 'left', pad: 2, label: 'Detail podujatia' },
			],
		},
	],
};
