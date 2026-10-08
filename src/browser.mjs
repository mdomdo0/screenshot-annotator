import { chromium } from 'playwright-core';

export async function launch(config, headless = true) {
	const options = { headless };
	if (config.browserPath) {
		options.executablePath = config.browserPath;
	} else {
		options.channel = config.channel ?? 'chrome';
	}
	try {
		return await chromium.launch(options);
	} catch (error) {
		if (/Executable doesn't exist|not found|ENOENT/i.test(error.message)) {
			throw new Error('Nenašiel sa prehliadač. Nainštaluj Google Chrome alebo nastav v konfigurácii browserPath (cesta k Chrome/Chromium/Edge).');
		}
		throw error;
	}
}
