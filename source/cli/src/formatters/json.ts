import type { ContextPackage } from '../model/types.js';

export function formatContextJson(pkg: ContextPackage): string {
  return JSON.stringify(
    {
      nodePath: pkg.nodePath,
      nodeName: pkg.nodeName,
      generatedAt: new Date().toISOString(),
      layers: pkg.layers.map((l) => ({
        type: l.type,
        label: l.label,
        content: l.content,
      })),
      mapping: pkg.mapping,
      tokenCount: pkg.tokenCount,
    },
    null,
    2,
  );
}
