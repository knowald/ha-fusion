import { describe, expect, it } from 'vitest';
import { integerFromInput, numberFromInput } from './numbers';

describe('numberFromInput', () => {
	it('reads whole numeric fields only', () => {
		expect(numberFromInput(' 24 ')).toBe(24);
		expect(numberFromInput('0.72')).toBe(0.72);
		expect(numberFromInput('-3.5')).toBe(-3.5);
		for (const junk of ['24hours', '0.72oops', '', 'x', '1,5', '1 2', '1e999']) {
			expect(numberFromInput(junk), junk).toBeNaN();
		}
	});

	it('rounds whole-number fields', () => {
		expect(integerFromInput('12.6')).toBe(13);
		expect(integerFromInput('abc')).toBeNaN();
	});
});
