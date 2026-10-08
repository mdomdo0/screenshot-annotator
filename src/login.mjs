import { launch } from './browser.mjs';
import { resolveUrl } from './config.mjs';

export async function login(config, url) {
	const browser = await launch(config, false);
	const context = await browser.newContext({ ...config.context, ignoreHTTPSErrors: config.ignoreHTTPSErrors, viewport: null });
	const page = await context.newPage();
	await page.goto(resolveUrl(config, url ?? config.loginUrl));

	console.log('Prihlás sa v otvorenom okne prehliadača a potom tu stlač Enter.');
	await new Promise((resolve) => process.stdin.once('data', resolve));
	process.stdin.pause();

	await context.storageState({ path: config.auth });
	await browser.close();
	return config.auth;
}
