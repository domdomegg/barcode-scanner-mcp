import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import bwipjs from 'bwip-js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases(
	{
		text: z.string().describe('Text or URL to encode in the QR code'),
		scale: z.number().int().min(1).max(20).default(3).describe('Scaling factor (default: 3)'),
		error_correction: z.enum(['L', 'M', 'Q', 'H']).default('M').describe('Error correction level: L (7%), M (15%), Q (25%), H (30%)'),
	},
	{
		data: 'text',
		content: 'text',
	},
);

export function registerGenerateQr(server: McpServer): void {
	server.registerTool(
		'generate_qr',
		{
			title: 'Generate QR code',
			description: 'Generate a QR code image from text or a URL. Returns a PNG image.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async (args) => {
			const png = await bwipjs.toBuffer({
				bcid: 'qrcode',
				text: args.text,
				scale: args.scale,
				eclevel: args.error_correction,
			} as bwipjs.RenderOptions);

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
