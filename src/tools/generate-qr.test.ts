import {describe, it, expect} from 'vitest';
import {callWithValidation, getRegisteredTool} from './_test-utils.js';

describe('generate_qr', () => {
	it('generates a QR code', async () => {
		const {meta, handler} = getRegisteredTool('generate_qr');
		const result = await callWithValidation(meta.inputSchema, handler, {
			text: 'https://example.com',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		expect(result.content).toHaveLength(1);
		expect(result.content[0]!.type).toBe('image');
		expect(result.content[0]!.mimeType).toBe('image/png');
		expect(result.content[0]!.data.length).toBeGreaterThan(0);

		// Verify it's valid PNG
		const buf = Buffer.from(result.content[0]!.data, 'base64');
		expect(buf[0]).toBe(0x89);
		expect(buf[1]).toBe(0x50);
	});

	it('accepts alias "data" for "text"', async () => {
		const {meta, handler} = getRegisteredTool('generate_qr');
		const result = await callWithValidation(meta.inputSchema, handler, {
			data: 'test alias',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		expect(result.content[0]!.type).toBe('image');
	});
});
