/**
 * Ascending comfort thresholds for a numeric sensor: below `good` reads GOOD,
 * below `fair` reads FAIR, else POOR. `max` scales the banded track and
 * defaults to 1.5x `fair`.
 */
export interface VerdictBands {
	good: number;
	fair: number;
	max?: number;
}

export interface AirVerdict {
	label: 'GOOD' | 'FAIR' | 'POOR';
	tone: 'good' | 'fair' | 'poor';
	/** Reading's position on the banded track, 0..1. */
	fraction: number;
	/** Band boundaries on the track, 0..1 each. */
	ticks: number[];
}

function verdict(tone: AirVerdict['tone'], fraction: number, ticks: number[]): AirVerdict {
	return {
		label: tone === 'good' ? 'GOOD' : tone === 'fair' ? 'FAIR' : 'POOR',
		tone,
		fraction: Math.min(1, Math.max(0, fraction)),
		ticks
	};
}

/**
 * Reads a sensor against WHO/ASHRAE-style comfort bands. Bands are indoor-air
 * oriented: CO2 in ppm, PM2.5 in ug/m3, humidity in %RH (where the comfortable
 * range is a window, not a maximum).
 */
export function airQualityVerdict(
	deviceClass: string | undefined,
	value: number | null,
	custom?: false | VerdictBands
): AirVerdict | null {
	if (value === null || custom === false) return null;
	if (custom) {
		const scale = custom.max ?? custom.fair * 1.5;
		const tone = value < custom.good ? 'good' : value < custom.fair ? 'fair' : 'poor';
		return verdict(tone, value / scale, [custom.good / scale, custom.fair / scale]);
	}
	if (deviceClass === 'carbon_dioxide') {
		const tone = value < 600 ? 'good' : value < 1000 ? 'fair' : 'poor';
		return verdict(tone, value / 1500, [600 / 1500, 1000 / 1500]);
	}
	if (deviceClass === 'pm25') {
		const tone = value < 12 ? 'good' : value < 35 ? 'fair' : 'poor';
		return verdict(tone, value / 50, [12 / 50, 35 / 50]);
	}
	if (deviceClass === 'humidity') {
		const tone = value >= 30 && value <= 60 ? 'good' : value >= 20 && value <= 70 ? 'fair' : 'poor';
		return verdict(tone, value / 100, [0.3, 0.6]);
	}
	return null;
}
