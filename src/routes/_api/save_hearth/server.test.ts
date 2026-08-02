import { beforeEach, describe, expect, it, vi } from 'vitest';

const disk = vi.hoisted(() => ({ data: '' as string | null, pending: '' }));

vi.mock('fs/promises', () => ({
	readFile: vi.fn(async () => {
		if (disk.data === null) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
		return disk.data;
	}),
	mkdir: vi.fn(async () => undefined),
	copyFile: vi.fn(async () => undefined),
	readdir: vi.fn(async () => []),
	unlink: vi.fn(async () => undefined),
	open: vi.fn(async (path: string) => ({
		writeFile: vi.fn(async (data: string) => {
			if (path.endsWith('.tmp')) disk.pending = data;
		}),
		sync: vi.fn(async () => undefined),
		close: vi.fn(async () => undefined)
	})),
	rename: vi.fn(async () => {
		disk.data = disk.pending;
	})
}));

import { POST } from './+server';

function request(revision: number, name: string) {
	return POST({
		request: new Request('http://localhost/_api/save_hearth', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ revision, config: { rail: [], rooms: [], name } })
		})
	} as any) as Promise<Response>;
}

describe('Hearth save endpoint', () => {
	beforeEach(() => {
		disk.data = null;
		disk.pending = '';
	});

	it('accepts only one of two concurrent saves at the same revision', async () => {
		const responses = await Promise.all([request(0, 'first'), request(0, 'second')]);
		expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
		expect(disk.data).toContain('revision: 1');
	});

	it('refuses to overwrite malformed YAML', async () => {
		disk.data = 'rooms: [unterminated';
		await expect(request(0, 'replacement')).rejects.toMatchObject({ status: 500 });
		expect(disk.data).toBe('rooms: [unterminated');
	});
});
