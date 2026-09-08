import { describe, expect, it } from 'vitest';
import { applyMath, evaluate } from './math';

describe('chart math', () => {
	it('follows arithmetic precedence and parentheses', () => {
		expect(evaluate('1 + 2 * 3', 0)).toBe(7);
		expect(evaluate('(1 + 2) * 3', 0)).toBe(9);
		expect(evaluate('2 * -x', 4)).toBe(-8);
		expect(evaluate('10 % 4 + x / 2', 3)).toBe(3.5);
		expect(evaluate('(x - 32) * 5 / 9', 212)).toBe(100);
		expect(evaluate('.5 + x', 1)).toBe(1.5);
		expect(evaluate('1. + x', 1)).toBe(2);
		expect(applyMath(3, 'x * 2.')).toBe(6);
	});

	it('rejects anything that is not arithmetic', () => {
		for (const source of ['x.constructor', 'alert(1)', '1 +', '(1', 'x x', '2 ** 3', 'y', '']) {
			expect(evaluate(source, 1), source).toBeNull();
		}
	});

	it('leaves the value alone for a bad or non-finite expression', () => {
		expect(applyMath(5, undefined)).toBe(5);
		expect(applyMath(5, ' x ')).toBe(5);
		expect(applyMath(5, 'x / 0')).toBe(5);
		expect(applyMath(5, 'nope')).toBe(5);
		expect(applyMath(1500, 'x / 1000')).toBe(1.5);
		expect(applyMath(3, 'x * 1,5')).toBe(4.5);
	});
});
