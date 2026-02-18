import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import sharp from 'sharp';
import {
	MultiFormatReader,
	BarcodeFormat,
	DecodeHintType,
	RGBLuminanceSource,
	BinaryBitmap,
	HybridBinarizer,
} from '@zxing/library';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const formatHints: Record<string, BarcodeFormat[]> = {
	qr: [BarcodeFormat.QR_CODE],
	ean13: [BarcodeFormat.EAN_13],
	ean8: [BarcodeFormat.EAN_8],
	upca: [BarcodeFormat.UPC_A],
	upce: [BarcodeFormat.UPC_E],
	code128: [BarcodeFormat.CODE_128],
	code39: [BarcodeFormat.CODE_39],
	code93: [BarcodeFormat.CODE_93],
	itf: [BarcodeFormat.ITF],
	codabar: [BarcodeFormat.CODABAR],
	datamatrix: [BarcodeFormat.DATA_MATRIX],
	aztec: [BarcodeFormat.AZTEC],
	pdf417: [BarcodeFormat.PDF_417],
};

const inputSchema = strictSchemaWithAliases(
	{
		image: z.string().describe('Base64-encoded image data (PNG, JPEG, etc.)'),
		format_hint: z.enum([
			'qr',
			'ean13',
			'ean8',
			'upca',
			'upce',
			'code128',
			'code39',
			'code93',
			'itf',
			'codabar',
			'datamatrix',
			'aztec',
			'pdf417',
		]).optional().describe('Expected barcode format. If omitted, all formats are tried.'),
	},
	{},
);

const outputSchema = z.object({
	format: z.string().describe('Detected barcode format (e.g. QR_CODE, EAN_13)'),
	text: z.string().describe('Decoded text content'),
});

async function loadImage(image: string): Promise<{data: Buffer; width: number; height: number}> {
	const {data, info} = await sharp(Buffer.from(image, 'base64'))
		.flatten({background: {r: 255, g: 255, b: 255}})
		.ensureAlpha()
		.raw()
		.toBuffer({resolveWithObject: true});

	return {data, width: info.width, height: info.height};
}

function rgbaToArgbInt32(data: Buffer, width: number, height: number): Int32Array {
	const pixels = new Int32Array(width * height);
	for (let i = 0; i < pixels.length; i++) {
		const offset = i * 4;
		const r = data[offset]!;
		const g = data[offset + 1]!;
		const b = data[offset + 2]!;
		const a = data[offset + 3]!;
		// eslint-disable-next-line no-bitwise
		pixels[i] = (a << 24) | (r << 16) | (g << 8) | b;
	}

	return pixels;
}

export function registerDecodeImage(server: McpServer): void {
	server.registerTool(
		'decode_image',
		{
			title: 'Decode barcode/QR code',
			description: 'Decode a barcode or QR code from a base64-encoded image. Supports QR, EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar, Data Matrix, Aztec, and PDF 417.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async (args) => {
			const {data, width, height} = await loadImage(args.image);
			const pixels = rgbaToArgbInt32(data, width, height);

			const hints = new Map<DecodeHintType, unknown>();
			if (args.format_hint && formatHints[args.format_hint]) {
				hints.set(DecodeHintType.POSSIBLE_FORMATS, formatHints[args.format_hint]);
			}

			hints.set(DecodeHintType.TRY_HARDER, true);

			const reader = new MultiFormatReader();
			reader.setHints(hints);

			const luminanceSource = new RGBLuminanceSource(pixels, width, height);
			const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

			const result = reader.decode(binaryBitmap);

			return jsonResult(outputSchema.parse({
				format: BarcodeFormat[result.getBarcodeFormat()],
				text: result.getText(),
			}));
		},
	);
}
