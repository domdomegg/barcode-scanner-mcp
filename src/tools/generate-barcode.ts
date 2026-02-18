import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import bwipjs from 'bwip-js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const supportedFormats = [
	'code128',
	'code39',
	'code93',
	'ean13',
	'ean8',
	'upca',
	'upce',
	'itf14',
	'interleaved2of5',
	'isbn',
	'issn',
	'ismn',
	'datamatrix',
	'pdf417',
	'azteccode',
	'gs1-128',
	'pharmacode',
	'codabar',
	'msi',
	'plessey',
	'postnet',
	'onecode',
	'royalmail',
	'code11',
	'code49',
] as const;

const inputSchema = strictSchemaWithAliases(
	{
		text: z.string().describe('Data to encode in the barcode'),
		format: z.enum(supportedFormats).describe('Barcode format to generate'),
		scale: z.number().int().min(1).max(20).default(3).describe('Scaling factor (default: 3)'),
		height: z.number().min(1).max(100).default(10).describe('Bar height in mm (default: 10, ignored for 2D formats)'),
		include_text: z.boolean().default(true).describe('Show human-readable text below barcode (default: true)'),
	},
	{
		data: 'text',
		content: 'text',
		type: 'format',
		includetext: 'include_text',
	},
);

export function registerGenerateBarcode(server: McpServer): void {
	server.registerTool(
		'generate_barcode',
		{
			title: 'Generate barcode',
			description: `Generate a barcode image in various formats. Returns a PNG image. Supported formats: ${supportedFormats.join(', ')}.`,
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async (args) => {
			const png = await bwipjs.toBuffer({
				bcid: args.format,
				text: args.text,
				scale: args.scale,
				height: args.height,
				includetext: args.include_text,
			});

			return {
				content: [{
					type: 'image',
					data: png.toString('base64'),
					mimeType: 'image/png',
				}],
			} satisfies CallToolResult;
		},
	);
}
