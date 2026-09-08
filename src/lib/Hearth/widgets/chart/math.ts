/**
 * Applies a user expression over `x` to a sensor value. Only arithmetic is
 * allowed; anything else makes the expression a no-op so a typo cannot run
 * code. Commas are accepted as decimal separators.
 */
export function applyMath(value: number, expression: string | undefined): number {
	if (!expression || expression.trim() === 'x') return value;
	const source = expression.trim().replace(/,/g, '.');
	if (!/^[0-9x+\-*/().\s%]+$/.test(source)) return value;
	try {
		const result = new Function('x', `return (${source});`)(value);
		return typeof result === 'number' && Number.isFinite(result) ? result : value;
	} catch {
		return value;
	}
}

export const PERIOD_MS = {
	hour: 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000
} as const;
