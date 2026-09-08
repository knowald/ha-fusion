/**
 * Numbers typed into editor fields. parseFloat would read "24hours" as 24 and
 * "0.72oops" as 0.72; a field either holds a whole number or it holds nothing.
 * NaN stands for nothing, so the usual Number.isFinite guard keeps working.
 */
const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;

export function numberFromInput(value: string): number {
	const trimmed = value.trim();
	const parsed = NUMBER.test(trimmed) ? Number(trimmed) : NaN;
	return Number.isFinite(parsed) ? parsed : NaN;
}

/** A whole number from an editor field; fractions round to the nearest unit. */
export function integerFromInput(value: string): number {
	return Math.round(numberFromInput(value));
}
