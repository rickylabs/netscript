import { buildTokens, TOKEN_DENSITIES, TOKEN_PRESETS, TOKEN_SCHEMES } from '../tokens.ts';
import { defaultTokenSources } from '../src/tokens/adapters/default-token-sources.ts';
import {
  defaultContrastCoverage,
  defaultContrastExclusions,
} from '../src/tokens/adapters/default-token-quality.ts';
import { tokenContrastColor } from '../src/tokens/adapters/contrast-color.ts';
import {
  assertTokenContrast,
  evaluateTokenContrast,
} from '../src/tokens/domain/check-token-contrast.ts';
import type { TokenDocument } from '../src/tokens/domain/token-contract.ts';
import { INACTIVE_COMPONENT_CONTRAST } from '../src/tokens/domain/contrast-contract.ts';
import { tokenAlias } from '../src/tokens/domain/token-contract.ts';
import roleRegistry from '../tokens/role-manifest.json' with { type: 'json' };

const CONTROLS = ['unknown-name', 'raw-semantic', 'contrast', 'exempt-active'];

if (Deno.args.includes('--help')) {
  console.log(`tokens:validate [--report] [--negative-control=${CONTROLS.join('|')}]`);
} else {
  try {
    const control = Deno.args.find((arg) => arg.startsWith('--negative-control='))?.split('=')[1];
    const unknown = Deno.args.find((arg) =>
      arg !== '--' && arg !== '--report' && !arg.startsWith('--negative-control=')
    );
    if (unknown || control !== undefined && !CONTROLS.includes(control)) {
      throw new Error(`Unknown token check argument: ${unknown ?? control}`);
    }
    const sources = structuredClone(defaultTokenSources());
    const semantic = sources.documents['semantic.tokens.json'].semantic as TokenDocument;
    if (control === 'unknown-name') {
      semantic['unknown-role'] = tokenAlias('semantic.primary', 'color', {
        cssVar: '--ns-unknown-role',
      });
    }
    if (control === 'raw-semantic') {
      semantic.primary = {
        $type: 'color',
        $value: { colorSpace: 'oklch', components: [1, 0, 0], alpha: 1, hex: '#ffffff' },
        $extensions: { netscript: { cssVar: '--ns-primary' } },
      };
    }
    const build = await buildTokens({ sources });
    const expected = TOKEN_PRESETS.flatMap((preset) =>
      TOKEN_SCHEMES.map((scheme) => `${preset.id}/${scheme}`)
    );
    const actual = new Set(
      build.contexts.map((context) => `${context.preset.id}/${context.scheme}`),
    );
    if (
      build.contexts.length !== expected.length * TOKEN_DENSITIES.length ||
      actual.size !== expected.length || expected.some((key) => !actual.has(key))
    ) throw new Error('Contrast check is missing a requested preset/scheme/density context');
    const coverage = defaultContrastCoverage();
    if (control === 'exempt-active') {
      const active = coverage.pairs.find((pair) => pair.foreground === 'fg')!;
      Object.assign(active, { exemption: INACTIVE_COMPONENT_CONTRAST.exemption });
    }
    const checked = control === 'contrast'
      ? {
        ...coverage,
        pairs: [...coverage.pairs, {
          id: 'negative-control/bg-on-bg',
          foreground: 'bg',
          background: ['bg'],
          minimum: 4.5 as const,
          presets: ['studio-utility'],
        }],
      }
      : coverage;
    const report = evaluateTokenContrast(
      build.contexts,
      checked,
      defaultContrastExclusions(),
      tokenContrastColor,
    );
    if (Deno.args.includes('--report')) {
      console.log(
        JSON.stringify(
          {
            inputs: build.contexts.length,
            effectiveContexts: actual.size,
            roles: Object.keys(roleRegistry.roles).length,
            pairDefinitions: checked.pairs.length,
            ...report,
          },
          null,
          2,
        ),
      );
    }
    assertTokenContrast(report);
    if (!Deno.args.includes('--report')) {
      console.log(
        `Token quality PASS: ${build.contexts.length} inputs, ${actual.size} effective contexts, ${
          Object.keys(roleRegistry.roles).length
        } registered roles, ${report.checks} contrast uses, ${report.excluded.length} exact source exclusions, ${report.exempt.length} exempt inactive text uses.`,
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exitCode = 1;
  }
}
