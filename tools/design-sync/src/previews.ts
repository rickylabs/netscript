/**
 * Preview-card emitter.
 *
 * Every card-bearing unit gets, under `components/<group>/<Pascal>/`:
 *   - `<Pascal>.html`      the canvas card (first line: `<!-- @dsCard -->`)
 *   - `<Pascal>.tsx`       the converted source, as prop-contract truth
 *   - `<Pascal>.prompt.md` distilled usage: JSDoc header, props, ns-* classes
 * plus `_preview/<Pascal>.js` — the story registry (`window.__dsPreview`).
 *
 * v1 stories are floor cards (bare render, label children when accepted),
 * the fast path eis-chat chose; authored stories drop into
 * `tools/design-sync/previews/<unit>.preview.js` and replace the floor card
 * verbatim on the next build. Trap `render-blank` reports which floor cards
 * are predicted blank so authoring effort goes where it matters.
 */
import type { ConversionResult, RegistryUnit, SyncConfig } from './types.ts';
import { fwd } from './config.ts';

export interface CardSet {
  /** bundle-relative path → content */
  files: Map<string, string>;
  /** units whose floor card is predicted to render blank/broken */
  predictedBlank: string[];
  /** units using an authored story instead of a floor card */
  authored: string[];
}

function cardHtml(template: string, name: string): string {
  return template.replaceAll('{{NAME}}', name);
}

function floorStory(conv: ConversionResult): string {
  const props = conv.props;
  const children = props?.hasChildren ? `, ${JSON.stringify(conv.exportName)}` : '';
  return `// generated floor card for "${conv.unit}" — author tools/design-sync/previews/${conv.unit}.preview.js to replace
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  window.__dsPreview = {
    ${conv.exportName}: function () {
      return R.createElement(NS.${conv.exportName}, null${children});
    },
  };
})();
`;
}

function promptMd(unit: RegistryUnit, conv: ConversionResult): string {
  const source = unit.sources.find((s) => s.pkgPath.endsWith('.tsx'))?.content ?? '';
  const header = source.match(/\/\*\*[\s\S]*?\*\//)?.[0] ?? '';
  const classSet = new Set<string>();
  for (const src of unit.sources) {
    for (const m of src.content.matchAll(/\bns-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9-]+)?\b/g)) {
      classSet.add(m[0]);
    }
  }
  const lines = [
    `# ${conv.exportName} (\`${unit.item.name}\`, ${unit.item.kind}, layer ${unit.item.layer})`,
    '',
    unit.item.description,
    '',
  ];
  if (header) lines.push('## Source header', '', '```ts', header, '```', '');
  if (conv.props?.raw) {
    lines.push(
      '## Props (real TypeScript contract — authoritative, not a weak `.d.ts`)',
      '',
      '```ts',
      conv.props.raw,
      '```',
      '',
    );
  }
  if (classSet.size) {
    lines.push(
      '## Class contract',
      '',
      [...classSet].sort().map((c) => `\`${c}\``).join(' · '),
      '',
    );
  }
  if (unit.item.registryDependencies?.length) {
    lines.push(`Registry dependencies: ${unit.item.registryDependencies.join(', ')}`, '');
  }
  return `${lines.join('\n')}\n`;
}

export async function emitCards(
  cfg: SyncConfig,
  units: RegistryUnit[],
  conversions: ConversionResult[],
  pkgFiles: Map<string, string>,
  cardTemplate: string,
): Promise<CardSet> {
  const files = new Map<string, string>();
  const predictedBlank: string[] = [];
  const authored: string[] = [];
  const byName = new Map(units.map((u) => [u.item.name, u]));
  const toolRoot = `${cfg.repoRoot}/tools/design-sync`;

  for (const conv of conversions) {
    if (!conv.group || !conv.exportName) continue;
    const unit = byName.get(conv.unit);
    if (!unit) continue;
    const dir = `components/${conv.group}/${conv.exportName}`;

    files.set(
      `${dir}/${conv.exportName}.html`,
      `<!-- @dsCard group="${conv.group}" -->\n${cardHtml(cardTemplate, conv.exportName)}`,
    );

    const tsxPath = conv.files.find((f) => f.endsWith('.tsx'));
    if (tsxPath && pkgFiles.has(tsxPath)) {
      files.set(`${dir}/${conv.exportName}.tsx`, pkgFiles.get(tsxPath) as string);
    }
    files.set(`${dir}/${conv.exportName}.prompt.md`, promptMd(unit, conv));

    let story: string | undefined;
    try {
      story = await Deno.readTextFile(fwd(`${toolRoot}/previews/${conv.unit}.preview.js`));
      authored.push(conv.unit);
    } catch {
      story = floorStory(conv);
      const required = conv.props?.required ?? [];
      if (required.length || (conv.props && !conv.props.hasChildren)) {
        predictedBlank.push(
          `${conv.unit}${
            required.length ? ` (required props: ${required.join(', ')})` : ' (no children prop)'
          }`,
        );
      }
    }
    files.set(`_preview/${conv.exportName}.js`, story);
  }
  return { files, predictedBlank, authored };
}
