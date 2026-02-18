# barcode-scanner-mcp

MCP server for scanning and generating barcodes and QR codes.

## Use Cases

**Decode a barcode from a photo**: "What does this barcode say?" → reads the image, detects the barcode format, and returns the decoded text.

**Generate a QR code**: "Create a QR code for https://example.com" → generates a PNG QR code image with configurable error correction.

**Create shipping labels**: "Generate a Code 128 barcode for tracking number 1Z999AA10123456784" → produces a barcode image in the specified format.

**Verify printed barcodes**: "Scan this product barcode and look up the item" → decodes the barcode and returns the text for further lookup.

## Setup

```bash
claude mcp add barcode-scanner-mcp -- npx -y barcode-scanner-mcp
```

Or with HTTP transport:

```bash
# Start the server
MCP_TRANSPORT=http PORT=3000 npx -y barcode-scanner-mcp

# Add to Claude
claude mcp add --transport http barcode-scanner-mcp http://localhost:3000/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `decode_image` | Decode a barcode or QR code from an image file or base64 data |
| `generate_qr` | Generate a QR code PNG from text or a URL |
| `generate_barcode` | Generate a barcode PNG in 25+ formats (Code 128, EAN-13, UPC-A, etc.) |

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`

## Releases

Versions follow the [semantic versioning spec](https://semver.org/).

To release:

1. Use `npm version <major | minor | patch>` to bump the version
2. Run `git push --follow-tags` to push with tags
3. Wait for GitHub Actions to publish to the NPM registry.
