#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG, loadConfig } from '../src/config.mjs';

const MIN_NODE = 20;
if (Number(process.versions.node.split('.')[0]) < MIN_NODE) {
	console.error(`Chyba: shotmark potrebuje Node.js ${MIN_NODE} alebo novší, máš ${process.versions.node}. Nainštaluj novší Node (napr. nvm install --lts).`);
	process.exit(1);
}

const HELP = `shotmark – screenshoty webu s číslovanými značkami

Použitie:
  shotmark init [súbor]              vytvorí vzorovú konfiguráciu (predvolene ${DEFAULT_CONFIG})
  shotmark login [-c súbor] [--url adresa]
                                     otvorí prehliadač na prihlásenie, uloží reláciu
  shotmark [shoot] [-c súbor] [--only a,b]
                                     vytvorí screenshoty podľa konfigurácie

Voľby:
  -c, --config <súbor>   konfiguračný súbor (predvolene ${DEFAULT_CONFIG})
  --only <názvy>         len vybrané screenshoty, oddelené čiarkou
  --url <adresa>         prihlasovacia stránka pre login (inak loginUrl z konfigurácie)
  -h, --help             táto nápoveda
`;

function parse(argv) {
	const opts = { command: 'shoot', config: DEFAULT_CONFIG, only: null, url: null, positional: [] };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '-h' || arg === '--help') opts.command = 'help';
		else if (arg === '-c' || arg === '--config') opts.config = argv[++i];
		else if (arg.startsWith('--config=')) opts.config = arg.slice(9);
		else if (arg === '--only') opts.only = argv[++i]?.split(',');
		else if (arg.startsWith('--only=')) opts.only = arg.slice(7).split(',');
		else if (arg === '--url') opts.url = argv[++i];
		else if (arg.startsWith('--url=')) opts.url = arg.slice(6);
		else if (i === 0 && ['init', 'login', 'shoot', 'help'].includes(arg)) opts.command = arg;
		else opts.positional.push(arg);
	}
	return opts;
}

const opts = parse(process.argv.slice(2));

try {
	if (opts.command === 'help') {
		console.log(HELP);
	} else if (opts.command === 'init') {
		const target = path.resolve(opts.positional[0] ?? opts.config);
		if (fs.existsSync(target)) throw new Error(`${target} už existuje.`);
		const template = fileURLToPath(new URL('../templates/shots.config.mjs', import.meta.url));
		fs.copyFileSync(template, target);
		console.log(`Vytvorené: ${target}\nUprav baseUrl a zoznam screenshotov, potom spusti: shotmark`);
	} else if (opts.command === 'login') {
		const { login } = await import('../src/login.mjs');
		const saved = await login(await loadConfig(opts.config), opts.url);
		console.log(`Prihlásenie uložené do ${saved} (súbor nikomu neposielaj).`);
	} else {
		const config = await loadConfig(opts.config);
		const { shoot } = await import('../src/shoot.mjs');
		const report = await shoot(config, { only: opts.only });
		console.log(report.join('\n'));
		console.log(`Hotovo, obrázky sú v ${config.outDir}`);
		if (report.some((line) => line.startsWith('✗'))) process.exitCode = 1;
	}
} catch (error) {
	console.error(`Chyba: ${error.message}`);
	process.exitCode = 1;
}
