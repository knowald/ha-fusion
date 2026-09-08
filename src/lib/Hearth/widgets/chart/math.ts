/*
 * A user expression over `x` applied to a sensor value, for example
 * `x / 1000` or `(x - 32) * 5 / 9`. Only arithmetic is understood, parsed
 * here rather than handed to the JavaScript engine, so the widget works under
 * a content security policy without unsafe-eval. Commas are accepted as
 * decimal separators. Anything the grammar does not cover, and any non-finite
 * result, leaves the value unchanged.
 */

export function applyMath(value: number, expression: string | undefined): number {
	if (!expression || expression.trim() === 'x') return value;
	const result = evaluate(expression.trim().replace(/,/g, '.'), value);
	return result !== null && Number.isFinite(result) ? result : value;
}

/** Evaluates `source` with `x` bound; null when it is not a plain arithmetic expression. */
export function evaluate(source: string, x: number): number | null {
	const parser = new Parser(source, x);
	try {
		const result = parser.expression();
		parser.skipSpace();
		return parser.done() ? result : null;
	} catch {
		return null;
	}
}

class Parser {
	private index = 0;

	constructor(
		private readonly source: string,
		private readonly x: number
	) {}

	done() {
		return this.index >= this.source.length;
	}

	skipSpace() {
		while (this.source[this.index] === ' ' || this.source[this.index] === '\t') this.index += 1;
	}

	private peek() {
		this.skipSpace();
		return this.source[this.index];
	}

	private take(char: string) {
		if (this.peek() !== char) return false;
		this.index += 1;
		return true;
	}

	// expression := term (('+' | '-') term)*
	expression(): number {
		let value = this.term();
		for (;;) {
			if (this.take('+')) value += this.term();
			else if (this.take('-')) value -= this.term();
			else return value;
		}
	}

	// term := unary (('*' | '/' | '%') unary)*
	private term(): number {
		let value = this.unary();
		for (;;) {
			if (this.take('*')) value *= this.unary();
			else if (this.take('/')) value /= this.unary();
			else if (this.take('%')) value %= this.unary();
			else return value;
		}
	}

	// unary := ('-' | '+') unary | primary
	private unary(): number {
		if (this.take('-')) return -this.unary();
		if (this.take('+')) return this.unary();
		return this.primary();
	}

	// primary := number | 'x' | '(' expression ')'
	private primary(): number {
		if (this.take('(')) {
			const value = this.expression();
			if (!this.take(')')) throw new SyntaxError('missing )');
			return value;
		}
		if (this.take('x')) return this.x;
		const match = /^\d+\.?\d*|^\.\d+/.exec(this.source.slice(this.index));
		if (!match) throw new SyntaxError(`unexpected input at ${this.index}`);
		this.index += match[0].length;
		return Number(match[0]);
	}
}

export const PERIOD_MS = {
	hour: 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000
} as const;
