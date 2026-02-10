# ArtifactReader

Reads all text-based artifact files from a node's directory.

## Interface

- `readArtifacts(dirPath: string, excludeFiles?: string[]): Promise<Artifact[]>`

## Behavior

- Lists all files in the directory
- Excludes `node.yaml` by default (via excludeFiles param)
- Skips child directories (only files)
- Skips binary file extensions: images (.png, .jpg, .gif, .svg, .ico, .webp), fonts (.woff, .woff2, .ttf, .eot), archives (.zip, .tar, .gz), compiled (.wasm, .pdf), media (.mp3, .mp4)
- Reads remaining files as UTF-8 text
- Returns sorted by filename: `Artifact[]` where each has `{ filename, content }`
