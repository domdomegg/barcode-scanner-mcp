import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import sharp from 'sharp';
import {scanGrayBuffer} from '@undecaf/zbar-wasm';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const zbarFormatMap: Record<string, string> = {
	ZBAR_QRCODE: 'QR_CODE',
	ZBAR_EAN13: 'EAN_13',
	ZBAR_EAN8: 'EAN_8',
	ZBAR_UPCA: 'UPC_A',
	ZBAR_UPCE: 'UPC_E',
	ZBAR_CODE128: 'CODE_128',
	ZBAR_CODE39: 'CODE_39',
	ZBAR_CODE93: 'CODE_93',
	ZBAR_I25: 'ITF',
	ZBAR_CODABAR: 'CODABAR',
	ZBAR_PDF417: 'PDF_417',
	ZBAR_ISBN10: 'ISBN_10',
	ZBAR_ISBN13: 'ISBN_13',
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
			'pdf417',
		]).optional().describe('Expected barcode format. If omitted, all formats are tried.'),
	},
	{},
);

const outputSchema = z.object({
	format: z.string().describe('Detected barcode format (e.g. QR_CODE, EAN_13)'),
	text: z.string().describe('Decoded text content'),
});

type PreprocessFn = (s: sharp.Sharp) => sharp.Sharp;

const preprocessingPipeline: PreprocessFn[] = [
	// 1. Raw greyscale — fast path for clean images
	s => s,
	// 2. Greyscale + normalise
	s => s.normalise(),
	// 3. Greyscale + median filter + normalise — reduces noise (e.g. screen moiré)
	s => s.median(3).normalise(),
	// 4. Greyscale + normalise + threshold
	s => s.normalise().threshold(128),
	// 5. Resize to 800px wide + greyscale + normalise — reduces moiré from high-res photos
	s => s.resize(800).normalise(),
	// 6. Resize + median + normalise
	s => s.resize(800).median(3).normalise(),
	// 7. Larger resize + median + normalise
	s => s.resize(1000).median(3).normalise(),
	// 8. Sharpen + normalise
	s => s.sharpen({sigma: 2}).normalise(),
	// 9. Blur to smooth moiré + normalise
	s => s.blur(1.5).normalise(),
];

async function tryDecode(imageBuffer: Buffer, preprocess: PreprocessFn) {
	const {data, info} = await preprocess(
		sharp(imageBuffer)
			.flatten({background: {r: 255, g: 255, b: 255}})
			.greyscale(),
	)
		.raw()
		.toBuffer({resolveWithObject: true});

	const arrayBuffer = new Uint8Array(data).buffer as ArrayBuffer;
	return scanGrayBuffer(arrayBuffer, info.width, info.height);
}

export function registerDecodeImage(server: McpServer): void {
	server.registerTool(
		'decode_image',
		{
			title: 'Decode barcode/QR code',
			description: 'Decode a barcode or QR code from a base64-encoded image. Supports QR, EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar, and PDF 417. Handles noisy real-world photos by trying multiple preprocessing approaches.',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async (args) => {
			const imageBuffer = Buffer.from(args.image, 'base64');

			for (const preprocess of preprocessingPipeline) {
				try {
					const symbols = await tryDecode(imageBuffer, preprocess);
					if (symbols.length > 0) {
						const symbol = symbols[0]!;
						const format = zbarFormatMap[symbol.typeName] ?? symbol.typeName;
						return jsonResult(outputSchema.parse({
							format,
							text: symbol.decode(),
						}));
					}
				} catch {
					// Preprocessing or scan failed, try next approach
				}
			}

			throw new Error('No barcode or QR code found in image after trying multiple preprocessing approaches');
		},
	);
}
