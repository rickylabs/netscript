/// <reference lib="dom" />
import process from 'node:process';
import type { Buffer } from 'node:buffer';
import { chromium } from 'playwright-core';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

interface Specimen {
  name: string;
  html: string;
}

async function readSpecimens(path: string): Promise<Specimen[]> {
  const input: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(input)) throw new Error('Expected specimen array');
  return input.map((entry: unknown) => {
    if (
      !entry || typeof entry !== 'object' || !('name' in entry) ||
      !('html' in entry) ||
      typeof entry.name !== 'string' || typeof entry.html !== 'string'
    ) {
      throw new Error('Invalid specimen');
    }
    return { name: entry.name, html: entry.html };
  });
}

async function registryCss(root: string): Promise<string> {
  const files = [join(root, 'registry/styles/layouts.css')];
  for (const folder of ['registry/components/ui', 'registry/islands']) {
    for (const entry of (await readdir(join(root, folder))).sort()) {
      if (entry.endsWith('.css')) files.push(join(root, folder, entry));
    }
  }
  return (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join(
    '\n',
  )
    .replace(/@import\s+[^;]+;/g, '');
}

const PROPERTIES = [
  'display',
  'position',
  'width',
  'height',
  'color',
  'background-color',
  'background-image',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-style',
  'border-radius',
  'box-shadow',
  'transform',
  'opacity',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'gap',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'align-items',
  'justify-content',
  'flex-direction',
  'outline-width',
  'outline-color',
  'outline-offset',
  'fill',
  'stroke',
  'visibility',
  'overflow',
  'cursor',
];

/** Compare real baseline and migrated markup/CSS with the same Utility token bytes. */
async function main(): Promise<void> {
  const [beforeRoot, afterRoot, beforeFile, afterFile, tokenFile, output] = process.argv.slice(2);
  if (!output) {
    throw new Error(
      'Usage: variant-parity <before-root> <after-root> <before.json> <after.json> <utility.css> <output>',
    );
  }
  const [before, after, oldCss, newCss, tokens] = await Promise.all([
    readSpecimens(beforeFile),
    readSpecimens(afterFile),
    registryCss(beforeRoot),
    registryCss(afterRoot),
    readFile(tokenFile, 'utf8'),
  ]);
  if (
    before.map((x) => x.name).join('\n') !== after.map((x) => x.name).join('\n')
  ) {
    throw new Error('Specimen inventories differ');
  }
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results: object[] = [];
  let failed = false;
  try {
    for (const scheme of ['light', 'dark'] as const) {
      for (const width of [390, 1280]) {
        const snapshots: { styles: Record<string, string>; png: Buffer }[] = [];
        for (
          const [label, specimens, css] of [['before', before, oldCss], [
            'after',
            after,
            newCss,
          ]] as const
        ) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            colorScheme: scheme,
            reducedMotion: 'reduce',
          });
          try {
            await page.setContent(
              `<html data-scheme="${scheme}" data-language="studio" data-flavor="utility"><head><style>${tokens}\n${css}\n*,:before,:after{animation:none!important;transition:none!important}body{margin:0;font-family:Arial,sans-serif}.specimen{padding:12px;border-bottom:1px solid #ddd;min-height:24px;overflow:hidden}</style></head><body>${
                specimens.map((s, index) =>
                  `<section class="specimen" data-case="${index}">${s.html}</section>`
                ).join('')
              }</body></html>`,
            );
            const styles: Record<string, string> = {};
            const client = await page.context().newCDPSession(page);
            await client.send('DOM.enable');
            await client.send('CSS.enable');
            const documentTree = await client.send('DOM.getDocument');
            const controls = await client.send('DOM.querySelectorAll', {
              nodeId: documentTree.root.nodeId,
              selector:
                'button,input,textarea,select,a,summary,[tabindex],.ns-card,[role="row"],.ns-responsive-table__row',
            });
            for (
              const [mode, classes] of [['rest', []], ['hover', ['hover']], [
                'focus',
                [
                  'focus',
                  'focus-visible',
                ],
              ], ['pressed', ['active']]] as const
            ) {
              await Promise.all(
                controls.nodeIds.map((nodeId) =>
                  client.send('CSS.forcePseudoState', {
                    nodeId,
                    forcedPseudoClasses: [...classes],
                  })
                ),
              );
              const stateStyles = await page.evaluate((properties) => {
                const output: Record<string, string> = {};
                for (
                  const container of document.querySelectorAll('[data-case]')
                ) {
                  let index = 0;
                  for (const node of container.querySelectorAll('[class]')) {
                    const classes = Array.from(node.classList).filter((c) =>
                      c.startsWith('ns-') && !c.includes('--')
                    );
                    if (!classes.length) {
                      continue;
                    }
                    const key = `${
                      container.getAttribute('data-case')
                    }/${index++}/${node.tagName}/${classes.join(' ')}`;
                    for (const pseudo of ['', '::before', '::after']) {
                      const style = getComputedStyle(node, pseudo || null);
                      for (const property of properties) {
                        output[`${key}${pseudo}/${property}`] = style
                          .getPropertyValue(property);
                      }
                    }
                  }
                }
                return output;
              }, PROPERTIES);
              for (const [key, value] of Object.entries(stateStyles)) {
                styles[`${mode}/${key}`] = value;
              }
            }
            await Promise.all(
              controls.nodeIds.map((nodeId) =>
                client.send('CSS.forcePseudoState', {
                  nodeId,
                  forcedPseudoClasses: [],
                })
              ),
            );
            const png = await page.screenshot({
              fullPage: true,
              animations: 'disabled',
            });
            await writeFile(
              join(output, `${label}-${scheme}-${width}.png`),
              png,
            );
            snapshots.push({ styles, png });
          } finally {
            await page.close();
          }
        }
        const [old, next] = snapshots;
        const differences = [
          ...new Set([...Object.keys(old.styles), ...Object.keys(next.styles)]),
        ]
          .filter((key) => old.styles[key] !== next.styles[key])
          .map((key) => ({
            key,
            before: old.styles[key],
            after: next.styles[key],
          }));
        const pixelsEqual = old.png.equals(next.png);
        failed ||= differences.length > 0 || !pixelsEqual;
        results.push({
          scheme,
          width,
          styleComparisons: Object.keys(old.styles).length,
          differences,
          pixelsEqual,
          beforeSha256: createHash('sha256').update(old.png).digest('hex'),
          afterSha256: createHash('sha256').update(next.png).digest('hex'),
        });
      }
    }
    await writeFile(
      join(output, 'parity.json'),
      JSON.stringify(
        {
          browser: browser.version(),
          specimens: before.length,
          properties: PROPERTIES,
          ok: !failed,
          results,
        },
        null,
        2,
      ) + '\n',
    );
  } finally {
    await browser.close();
  }
  if (failed) throw new Error('Utility visual parity failed; see parity.json');
}

await main();
