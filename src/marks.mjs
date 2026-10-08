export const DEFAULT_STYLE = { color: '#e5212c', border: 2.5, pad: 4, badge: 24, radius: 6, gap: 6 };

export function locatorFor(page, spec) {
	let scope = page;
	if (spec.frame) scope = scope.frameLocator(spec.frame);
	if (spec.within) scope = scope.locator(spec.within).first();

	let locator;
	if (spec.text != null) locator = scope.getByText(spec.text, { exact: spec.exact ?? true });
	else if (spec.role) locator = scope.getByRole(spec.role, spec.name ? { name: spec.name, exact: spec.exact ?? false } : {});
	else locator = scope.locator(spec.el);

	return locator.filter({ visible: true }).nth(spec.nth ?? 0);
}

export async function boxOf(page, spec, timeout = 3000) {
	const locator = locatorFor(page, spec);
	try {
		await locator.waitFor({ state: 'visible', timeout });
	} catch {
		return null;
	}
	let handle = await locator.elementHandle();
	if (spec.closest) {
		const parent = await handle.evaluateHandle((el, selector) => el.closest(selector), spec.closest);
		handle = parent.asElement();
		if (!handle) return null;
	}
	const box = await handle.boundingBox();
	if (!box) return null;
	const [sx, sy] = await page.evaluate(() => [window.scrollX, window.scrollY]);
	return { x: box.x + sx, y: box.y + sy, width: box.width, height: box.height };
}

export function describe(spec) {
	if (spec.text != null) return `text "${spec.text}"`;
	if (spec.role) return `role ${spec.role}${spec.name ? ` "${spec.name}"` : ''}`;
	return spec.el;
}

export function layout(found, style) {
	const s = style.badge;
	return found.map(({ box, n, spec }) => {
		const p = spec.pad ?? style.pad;
		const g = style.gap;
		const frame = { x: box.x - p, y: box.y - p, width: box.width + 2 * p, height: box.height + 2 * p };
		const cy = box.y + box.height / 2 - s / 2;
		const cx = box.x + box.width / 2 - s / 2;
		const positions = {
			right: [frame.x + frame.width + g, cy],
			left: [frame.x - g - s, cy],
			top: [cx, frame.y - g - s],
			bottom: [cx, frame.y + frame.height + g],
			corner: [frame.x - s / 2, frame.y - s / 2],
		};
		const [bx, by] = positions[spec.pos ?? 'right'] ?? positions.right;
		return { n, frame, badge: { x: bx, y: by, size: s } };
	});
}

export function paint({ items, style }) {
	const layer = document.createElement('div');
	layer.setAttribute('data-shotmark', '');
	Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '0', height: '0', zIndex: '2147483647', pointerEvents: 'none' });
	for (const { n, frame, badge } of items) {
		const box = document.createElement('div');
		Object.assign(box.style, {
			position: 'absolute',
			left: `${frame.x}px`,
			top: `${frame.y}px`,
			width: `${frame.width}px`,
			height: `${frame.height}px`,
			border: `${style.border}px solid ${style.color}`,
			borderRadius: `${style.radius}px`,
			boxSizing: 'border-box',
		});
		const dot = document.createElement('div');
		dot.textContent = String(n);
		Object.assign(dot.style, {
			position: 'absolute',
			left: `${badge.x}px`,
			top: `${badge.y}px`,
			width: `${badge.size}px`,
			height: `${badge.size}px`,
			borderRadius: '50%',
			background: style.color,
			color: '#fff',
			font: `700 ${Math.round(badge.size * 0.58)}px/${badge.size}px Arial, Helvetica, sans-serif`,
			textAlign: 'center',
			letterSpacing: '0',
			boxShadow: '0 1px 3px rgba(0,0,0,.35)',
		});
		layer.append(box, dot);
	}
	document.documentElement.append(layer);
	const r = layer.getBoundingClientRect();
	layer.style.left = `${-(r.left + window.scrollX)}px`;
	layer.style.top = `${-(r.top + window.scrollY)}px`;
}

export function numbered(marks = []) {
	let n = 0;
	return marks.map((spec) => {
		n = spec.n ?? n + 1;
		return { spec, n };
	});
}

export function legend(marks = []) {
	return numbered(marks)
		.filter(({ spec }) => spec.label)
		.map(({ spec, n }) => `${n}. ${spec.label}`);
}
