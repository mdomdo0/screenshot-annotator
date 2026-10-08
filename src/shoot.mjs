import fs from 'node:fs';
import path from 'node:path';
import { launch } from './browser.mjs';
import { resolveUrl } from './config.mjs';
import { DEFAULT_STYLE, boxOf, describe, layout, legend, numbered, paint } from './marks.mjs';

async function settle(page, config) {
	await page.waitForLoadState('networkidle', { timeout: config.settle }).catch(() => {});
	await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

async function preload(page) {
	await page.evaluate(async () => {
		const step = window.innerHeight * 0.8;
		for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
			window.scrollTo(0, y);
			await new Promise((r) => setTimeout(r, 120));
		}
		window.scrollTo(0, 0);
	});
}

async function runStep(page, step, config) {
	const loc = (selector) => page.locator(selector).first();
	if (step.goto) {
		await page.goto(resolveUrl(config, step.goto), { waitUntil: config.waitUntil });
		await settle(page, config);
	} else if (step.click) await loc(step.click).click();
	else if (step.dblclick) await loc(step.dblclick).dblclick();
	else if (step.hover) await loc(step.hover).hover();
	else if (step.fill) await loc(step.fill).fill(String(step.value ?? ''));
	else if (step.select) await loc(step.select).selectOption(step.value);
	else if (step.check) await loc(step.check).check();
	else if (step.press) await page.keyboard.press(step.press);
	else if (step.waitFor) await loc(step.waitFor).waitFor();
	else if (step.scrollTo) await loc(step.scrollTo).scrollIntoViewIfNeeded();
	else if (step.eval) await page.evaluate(step.eval);
	else if (step.dismiss) await page.evaluate(dismiss, step.dismiss);
	if (step.wait) await page.waitForTimeout(step.wait);
}

function dismiss(text) {
	const hits = [...document.querySelectorAll('body *')].filter((el) => el.textContent.includes(text));
	let el = hits[hits.length - 1];
	while (el && el !== document.body) {
		if (['fixed', 'sticky'].includes(getComputedStyle(el).position)) {
			el.remove();
			return;
		}
		el = el.parentElement;
	}
	hits[hits.length - 1]?.remove();
}

function union(a, b) {
	if (!a) return b;
	if (!b) return a;
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}

async function screenshotArea(page, shot, marksArea, padding) {
	if (shot.clip === 'full') return { fullPage: true };
	if (!shot.clip || shot.clip === 'viewport') return {};

	let target = null;
	for (const item of [shot.clip].flat()) {
		const spec = typeof item === 'string' ? { el: item } : item;
		const box = 'x' in spec ? spec : await boxOf(page, spec);
		if (!box) throw new Error(`oblasť na orezanie sa nenašla: ${describe(spec)}`);
		target = union(target, box);
	}

	const area = union(target, marksArea);
	const [pageWidth, pageHeight] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
	const x = Math.max(0, area.x - padding);
	const y = Math.max(0, area.y - padding);
	const right = Math.min(pageWidth, area.x + area.width + padding);
	const bottom = Math.min(pageHeight, area.y + area.height + padding);
	return { fullPage: true, clip: { x, y, width: right - x, height: bottom - y } };
}

export async function shoot(config, { only } = {}) {
	const shots = config.shots.filter((s) => !only || only.includes(s.name));
	if (!shots.length) {
		throw new Error(only ? `Žiadny screenshot s názvom: ${only.join(', ')}` : 'V konfigurácii nie sú žiadne screenshoty (shots).');
	}
	fs.mkdirSync(config.outDir, { recursive: true });

	const style = { ...DEFAULT_STYLE, ...config.style };
	const browser = await launch(config);
	const contexts = {};
	const context = async (auth) => {
		const key = auth ? 'auth' : 'anon';
		if (!contexts[key]) {
			if (auth && !fs.existsSync(config.auth)) {
				throw new Error('chýba prihlásenie – spusti: shotmark login');
			}
			contexts[key] = await browser.newContext({
				viewport: config.viewport,
				deviceScaleFactor: config.scale,
				ignoreHTTPSErrors: config.ignoreHTTPSErrors,
				reducedMotion: 'reduce',
				...config.context,
				storageState: auth ? config.auth : undefined,
			});
		}
		return contexts[key];
	};

	const report = [];
	for (const shot of shots) {
		let page;
		try {
			page = await (await context(shot.auth)).newPage();
			if (shot.viewport) await page.setViewportSize(shot.viewport);

			const hide = [...config.hide, ...(shot.hide ?? [])];
			const css = [hide.length ? `${hide.join(',')}{display:none!important}` : '', config.css ?? '', shot.css ?? ''].join('\n').trim();

			await page.goto(resolveUrl(config, shot.url), { waitUntil: config.waitUntil });
			await settle(page, config);
			if (css) await page.addStyleTag({ content: css });
			if (shot.preload ?? config.preload) await preload(page);
			for (const step of shot.steps ?? []) await runStep(page, step, config);

			const found = [];
			const missing = [];
			for (const { spec, n } of numbered(shot.marks)) {
				const box = await boxOf(page, spec, shot.timeout ?? config.timeout);
				if (box) found.push({ box, n, spec });
				else missing.push(`${n} (${describe(spec)})`);
			}
			const items = layout(found, style);
			if (items.length) await page.evaluate(paint, { items, style });

			const marksArea = items.reduce(
				(acc, { frame, badge }) => union(union(acc, frame), { x: badge.x, y: badge.y, width: badge.size, height: badge.size }),
				null,
			);
			const type = config.format === 'jpg' ? 'jpeg' : 'png';
			await page.screenshot({
				path: path.join(config.outDir, `${shot.name}.${config.format}`),
				type,
				animations: 'disabled',
				caret: 'hide',
				...(type === 'jpeg' ? { quality: 90 } : {}),
				...(await screenshotArea(page, shot, marksArea, shot.padding ?? config.padding)),
			});

			const lines = legend(shot.marks);
			if (lines.length) fs.writeFileSync(path.join(config.outDir, `${shot.name}.txt`), `${lines.join('\n')}\n`);

			report.push(missing.length ? `⚠ ${shot.name} – nenájdené značky: ${missing.join(', ')}` : `✓ ${shot.name}`);
		} catch (error) {
			report.push(`✗ ${shot.name} – ${error.message.split('\n')[0]}`);
		} finally {
			await page?.close();
		}
	}
	await browser.close();
	return report;
}
