import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_CONFIG = 'shots.config.mjs';

const DEFAULTS = {
	viewport: { width: 1440, height: 900 },
	scale: 2,
	format: 'png',
	outDir: 'out',
	auth: 'auth.json',
	loginUrl: '/',
	padding: 40,
	ignoreHTTPSErrors: true,
	waitUntil: 'load',
	settle: 5000,
	timeout: 3000,
	preload: false,
	hide: [],
	context: {},
	shots: [],
};

export async function loadConfig(file = DEFAULT_CONFIG) {
	const full = path.resolve(file);
	if (!fs.existsSync(full)) {
		throw new Error(`Konfigurácia ${full} neexistuje. Vytvor ju príkazom: shotmark init`);
	}
	const { default: raw } = await import(`${pathToFileURL(full)}?t=${Date.now()}`);
	const config = { ...DEFAULTS, ...raw };
	if (!config.baseUrl) {
		throw new Error(`V ${full} chýba baseUrl.`);
	}

	const dir = path.dirname(full);
	config.outDir = path.resolve(dir, config.outDir);
	config.auth = path.resolve(dir, config.auth);
	if (!/^[a-z]+:/i.test(config.baseUrl)) {
		config.baseUrl = pathToFileURL(path.resolve(dir, config.baseUrl) + path.sep).href;
	}
	return config;
}

export function resolveUrl(config, url = '') {
	return new URL(url, config.baseUrl).toString();
}
