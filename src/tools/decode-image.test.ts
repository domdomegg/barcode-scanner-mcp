import {describe, it, expect} from 'vitest';
import bwipjs from 'bwip-js';
import {callWithValidation, getRegisteredTool} from './_test-utils.js';

describe('decode_image', () => {
	it('decodes a QR code from base64 PNG', async () => {
		// Generate a QR code to decode
		const png = await bwipjs.toBuffer({
			bcid: 'qrcode',
			text: 'Hello World',
			scale: 3,
		});
		const base64 = png.toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		const result = await callWithValidation(meta.inputSchema, handler, {
			image: base64,
		}) as {structuredContent: {format: string; text: string}};

		expect(result.structuredContent.text).toBe('Hello World');
		expect(result.structuredContent.format).toBe('QR_CODE');
	});

	it('decodes a Code 128 barcode from base64 PNG', async () => {
		const png = await bwipjs.toBuffer({
			bcid: 'code128',
			text: 'Test123',
			scale: 3,
			height: 15,
		});
		const base64 = png.toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		const result = await callWithValidation(meta.inputSchema, handler, {
			image: base64,
		}) as {structuredContent: {format: string; text: string}};

		expect(result.structuredContent.text).toBe('Test123');
		expect(result.structuredContent.format).toBe('CODE_128');
	});

	it('decodes with format hint', async () => {
		const png = await bwipjs.toBuffer({
			bcid: 'qrcode',
			text: 'with hint',
			scale: 3,
		});
		const base64 = png.toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		const result = await callWithValidation(meta.inputSchema, handler, {
			image: base64,
			format_hint: 'qr',
		}) as {structuredContent: {format: string; text: string}};

		expect(result.structuredContent.text).toBe('with hint');
	});

	it('throws on undecodable image', async () => {
		// Create a blank white image (no barcode)
		const sharp = await import('sharp');
		const blank = await sharp.default({
			create: {
				width: 100, height: 100, channels: 3, background: {r: 255, g: 255, b: 255},
			},
		}).png().toBuffer();
		const base64 = blank.toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		await expect(callWithValidation(meta.inputSchema, handler, {
			image: base64,
		})).rejects.toThrow();
	});
});
