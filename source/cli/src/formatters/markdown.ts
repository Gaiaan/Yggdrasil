import type { ContextPackage } from '../model/types.js';

export function formatContextMarkdown(pkg: ContextPackage): string {
  let md = '';

  md += `# Context Package: ${pkg.nodeName}\n`;
  md += `# Path: ${pkg.nodePath}\n`;
  md += `# Generated: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  for (const layer of pkg.layers) {
    md += `## ${layer.label}\n\n`;
    md += layer.content;
    md += `\n\n---\n\n`;
  }

  if (pkg.mapping) {
    md += `## Materialization Target\n\n`;
    md += `**Mapping:** ${pkg.mapping.join(', ')}\n\n`;
    md += `---\n\n`;
  }

  // Footer
  md += `Context size: ${pkg.tokenCount.toLocaleString()} tokens\n`;
  md += `Layers: ${pkg.layers.map((l) => l.type).join(', ')}\n`;

  return md;
}
