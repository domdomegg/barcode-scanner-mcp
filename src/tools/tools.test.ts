import {
	describe, it, expect, vi, beforeEach,
} from 'vitest';
import {type McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerAll} from './index.js';

describe('tool registration', () => {
	let registeredTools: Map<string, {meta: unknown; handler: (args: unknown) => Promise<unknown>}>;

	beforeEach(() => {
		registeredTools = new Map();

		const server = {
			registerTool: vi.fn((name: string, meta: unknown, handler: (args: unknown) => Promise<unknown>) => {
				registeredTools.set(name, {meta, handler});
			}),
		} as unknown as McpServer;

		registerAll(server);
	});

	it('registers all expected tools', () => {
		const expectedTools = ['decode_image', 'generate_qr', 'generate_barcode'];

		for (const toolName of expectedTools) {
			expect(registeredTools.has(toolName), `Tool ${toolName} should be registered`).toBe(true);
		}
	});

	it('all tools have title and description', () => {
		for (const [name, tool] of registeredTools) {
			const meta = tool.meta as {title?: string; description?: string};
			expect(meta.title, `Tool ${name} should have a title`).toBeDefined();
			expect(meta.description, `Tool ${name} should have a description`).toBeDefined();
			expect(meta.title!.length, `Tool ${name} title should not be empty`).toBeGreaterThan(0);
			expect(meta.description!.length, `Tool ${name} description should not be empty`).toBeGreaterThan(0);
		}
	});

	it('all tools have input schema', () => {
		for (const [name, tool] of registeredTools) {
			const meta = tool.meta as {inputSchema?: unknown};
			expect(meta.inputSchema, `Tool ${name} should have inputSchema`).toBeDefined();
		}
	});

	it('all tools are marked read-only', () => {
		for (const [name, tool] of registeredTools) {
			const meta = tool.meta as {annotations?: {readOnlyHint?: boolean}};
			expect(meta.annotations?.readOnlyHint, `Tool ${name} should be readOnly`).toBe(true);
		}
	});
});
