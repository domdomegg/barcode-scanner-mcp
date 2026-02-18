import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerDecodeImage} from './decode-image.js';
import {registerGenerateQr} from './generate-qr.js';
import {registerGenerateBarcode} from './generate-barcode.js';

export function registerAll(server: McpServer): void {
	registerDecodeImage(server);
	registerGenerateQr(server);
	registerGenerateBarcode(server);
}
