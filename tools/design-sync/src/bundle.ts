/**
 * Bundle step: write the synthetic package to scratch, compile the single
 * `_ns_runtime.js` with native `deno bundle` (esbuild-backed, zero extra
 * deps), and assemble the canvas-ready upload tree.
 *
 * The scratch package carries its own `deno.jsonc` (classic React JSX
 * transform + pinned npm React) and is bundled with `--config` + `--no-lock`
 * so the workspace root config, its Preact JSX settings, and the repo lock
 * file are never touched.
 */
import type { ConversionResult, SyncConfig } from './types.ts';
import { fwd } from './config.ts';

function scratchDenoJson(cfg: SyncConfig): string {
  return JSON.stringify(
    {
      compilerOptions: {
        jsx: 'react',
        jsxFactory: 'React.createElement',
        jsxFragmentFactory: 'React.Fragment',
        lib: ['dom', 'dom.iterable', 'esnext'],
      },
      imports: {
        react: `npm:react@${cfg.react.version}`,
        'react-dom/client': `npm:react-dom@${cfg.react.domVersion}/client`,
      },
    },
    null,
    2,
  ) + '\n';
}

function bundleEntry(cfg: SyncConfig, conversions: ConversionResult[]): string {
  const imports: string[] = [
    `import * as ReactNamespace from 'react';`,
    `import * as ReactDOMClient from 'react-dom/client';`,
  ];
  const registry: string[] = [];
  for (const conv of conversions) {
    if (!conv.exportName) continue;
    const tsx = conv.files.find((f) => f.endsWith('.tsx'));
    if (!tsx) continue;
    const spec = `../${tsx}`;
    if (conv.defaultExport) imports.push(`import ${conv.exportName} from '${spec}';`);
    else imports.push(`import { ${conv.exportName} } from '${spec}';`);
    registry.push(conv.exportName);
  }
  const subNames: string[] = [];
  Object.values(cfg.subpaths).forEach((target, i) => {
    imports.push(`import * as __sub${i} from '../${target}';`);
    subNames.push(`__sub${i}`);
  });

  const unique = [...new Set(registry)];
  return `${imports.join('\n')}

const surface: Record<string, unknown> = {};
for (const ns of [${subNames.join(', ')}] as Record<string, unknown>[]) {
  for (const [key, value] of Object.entries(ns)) {
    if (/^[A-Z]/.test(key)) surface[key] = value;
  }
}
Object.assign(surface, { ${unique.join(', ')} });

const globals = globalThis as unknown as Record<string, unknown>;
globals.React = ReactNamespace;
globals.ReactDOM = ReactDOMClient;
globals.${cfg.globalName} = surface;
`;
}

async function writeTree(root: string, files: Map<string, string>): Promise<void> {
  for (const [rel, content] of files) {
    const abs = `${root}/${rel}`;
    await Deno.mkdir(abs.slice(0, abs.lastIndexOf('/')), { recursive: true });
    await Deno.writeTextFile(abs, content);
  }
}

export interface BundleResult {
  bundleJs: string;
  scratchRoot: string;
}

export async function buildBundleJs(
  cfg: SyncConfig,
  pkgFiles: Map<string, string>,
  conversions: ConversionResult[],
): Promise<BundleResult> {
  const scratchRoot = fwd(`${cfg.repoRoot}/${cfg.scratchDir}`);
  const pkgRoot = `${scratchRoot}/pkg`;
  try {
    await Deno.remove(pkgRoot, { recursive: true });
  } catch {
    // first build
  }

  const tree = new Map(pkgFiles);
  tree.set('deno.jsonc', scratchDenoJson(cfg));
  tree.set('__ds/bundle-entry.ts', bundleEntry(cfg, conversions));
  await writeTree(pkgRoot, tree);

  const outPath = `${pkgRoot}/__ds/_ns_runtime.js`;
  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      'bundle',
      '--quiet',
      '--no-lock',
      '--platform',
      'browser',
      '--config',
      `${pkgRoot}/deno.jsonc`,
      '-o',
      outPath,
      `${pkgRoot}/__ds/bundle-entry.ts`,
    ],
    cwd: pkgRoot,
    stdout: 'piped',
    stderr: 'piped',
  });
  const proc = await cmd.output();
  if (!proc.success) {
    const err = new TextDecoder().decode(proc.stderr);
    throw new Error(`deno bundle failed:\n${err}`);
  }

  let bundleJs = await Deno.readTextFile(outPath);
  // The entry exports nothing, so the ESM output is classic-script safe once
  // any (empty) export statement is dropped.
  bundleJs = bundleJs.replace(/\nexport\s*\{\s*\};?\s*$/, '\n');
  if (/process\.env/.test(bundleJs) && !/var process\s*=/.test(bundleJs)) {
    bundleJs = `var process = { env: { NODE_ENV: "production" } };\n${bundleJs}`;
  }
  const head = bundleJs.slice(0, 4000);
  if (/^import\s/.test(bundleJs) || /^export\s/m.test(head)) {
    throw new Error(
      'bundle output still contains module syntax; cards load it as a classic script',
    );
  }
  return { bundleJs, scratchRoot };
}
