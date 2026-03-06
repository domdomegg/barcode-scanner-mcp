import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, it, expect} from 'vitest';
import bwipjs from 'bwip-js';
import {callWithValidation, getRegisteredTool} from './_test-utils.js';

const fixturesDir = join(import.meta.dirname, 'test-fixtures');

type DecodeResult = {structuredContent: {codes: {format: string; text: string}[]}};

function expectCode(result: DecodeResult, format: string, text: string) {
	const match = result.structuredContent.codes.find((c) => c.format === format && c.text === text);
	expect(match, `Expected code ${format}:${text} in ${JSON.stringify(result.structuredContent.codes)}`).toBeTruthy();
}

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
		}) as DecodeResult;

		expectCode(result, 'QR_CODE', 'Hello World');
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
		}) as DecodeResult;

		expectCode(result, 'CODE_128', 'Test123');
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
		}) as DecodeResult;

		expectCode(result, 'QR_CODE', 'with hint');
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

	it('decodes EAN-13 and QR code from a real-world photo (arla yogurt)', async () => {
		const base64 = readFileSync(join(fixturesDir, 'arla-yogurt-back.jpg')).toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		const result = await callWithValidation(meta.inputSchema, handler, {
			image: base64,
		}) as DecodeResult;

		expectCode(result, 'EAN_13', '8718166007635');
		expectCode(result, 'QR_CODE', 'http://qr.arla.com/sustainability');
	});

	it('decodes EAN-8 from a real-world photo (chicken slices)', async () => {
		const base64 = readFileSync(join(fixturesDir, 'chicken-slices-back.jpg')).toString('base64');

		const {meta, handler} = getRegisteredTool('decode_image');
		const result = await callWithValidation(meta.inputSchema, handler, {
			image: base64,
		}) as DecodeResult;

		expectCode(result, 'EAN_8', '00285131');
	});
});
