import {describe, it, expect} from 'vitest';
import {callWithValidation, getRegisteredTool} from './_test-utils.js';

describe('generate_barcode', () => {
	it('generates a Code 128 barcode', async () => {
		const {meta, handler} = getRegisteredTool('generate_barcode');
		const result = await callWithValidation(meta.inputSchema, handler, {
			text: 'Hello123',
			format: 'code128',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		expect(result.content).toHaveLength(1);
		expect(result.content[0]!.type).toBe('image');
		expect(result.content[0]!.mimeType).toBe('image/png');
		expect(result.content[0]!.data.length).toBeGreaterThan(0);

		// Verify it's valid base64 by decoding
		const buf = Buffer.from(result.content[0]!.data, 'base64');
		// PNG magic bytes
		expect(buf[0]).toBe(0x89);
		expect(buf[1]).toBe(0x50); // P
		expect(buf[2]).toBe(0x4E); // N
		expect(buf[3]).toBe(0x47); // G
	});

	it('generates an EAN-13 barcode', async () => {
		const {meta, handler} = getRegisteredTool('generate_barcode');
		const result = await callWithValidation(meta.inputSchema, handler, {
			text: '5901234123457',
			format: 'ean13',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		expect(result.content[0]!.type).toBe('image');
		expect(result.content[0]!.mimeType).toBe('image/png');
	});
});
