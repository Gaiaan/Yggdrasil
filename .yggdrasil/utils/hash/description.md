# HashUtils

SHA-256 hashing for file content comparison (used by drift detection).

## Interface

- `hashFile(filePath: string): Promise<string>` — reads file, returns `sha256:<hex>`
- `hashString(content: string): string` — hashes a string synchronously, returns `sha256:<hex>`

## Details

- Uses `node:crypto` (createHash('sha256'))
- Output format: `sha256:` prefix followed by hex digest
- `hashFile` reads the file asynchronously before hashing
