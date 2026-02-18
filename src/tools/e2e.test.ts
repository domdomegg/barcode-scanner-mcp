import {describe, it, expect} from 'vitest';
import {callWithValidation, getRegisteredTool} from './_test-utils.js';

describe('e2e: generate then decode', () => {
	it('generates a QR code and decodes it back', async () => {
		const qr = getRegisteredTool('generate_qr');
		const decode = getRegisteredTool('decode_image');

		const genResult = await callWithValidation(qr.meta.inputSchema, qr.handler, {
			text: 'https://example.com/hello',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		const base64Png = genResult.content[0]!.data;

		const decodeResult = await callWithValidation(decode.meta.inputSchema, decode.handler, {
			image: base64Png,
		}) as {structuredContent: {format: string; text: string}};

		expect(decodeResult.structuredContent.format).toBe('QR_CODE');
		expect(decodeResult.structuredContent.text).toBe('https://example.com/hello');
	});

	it('generates a Code 128 barcode and decodes it back', async () => {
		const barcode = getRegisteredTool('generate_barcode');
		const decode = getRegisteredTool('decode_image');

		const genResult = await callWithValidation(barcode.meta.inputSchema, barcode.handler, {
			text: 'ABC-12345',
			format: 'code128',
		}) as {content: {type: string; data: string; mimeType: string}[]};

		const base64Png = genResult.content[0]!.data;

		const decodeResult = await callWithValidation(decode.meta.inputSchema, decode.handler, {
			image: base64Png,
		}) as {structuredContent: {format: string; text: string}};

		expect(decodeResult.structuredContent.format).toBe('CODE_128');
		expect(decodeResult.structuredContent.text).toBe('ABC-12345');
	});
});
