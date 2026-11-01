/**
 * Generate the consumer design skill from canonical guidelines and registry theme links.
 * Extend the registry/source docs, then run gen:design-skill; --check never writes.
 */
import type { Registry } from '../../../packages/fresh-ui/src/registry/registry-contract.ts';

const ROOT = new URL('../../../', import.meta.url);
const SOURCE_ROOT =
  'https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/';
const SKILL_PATH = 'skills/netscript-design/SKILL.md';
const REFERENCE_PATH = 'skills/netscript-design/references/GUIDELINES.md';
const REGISTRY_PATH = 'packages/fresh-ui/registry.json';
const THEMING_GUIDE = 'https://rickylabs.github.io/netscript/web-layer/how-to/theme-your-app/';

/** Owned output files and source provenance, shared by generation and the read-only check. */
export interface DesignSkillBuild {
  files: Readonly<Record<string, string>>;
  guidelinesSha256: string;
  themeIds: readonly string[];
  presetIds: readonly string[];
}

/** Build from the canonical guideline and every complete published theme pair. */
export async function buildDesignSkill(root: URL = ROOT): Promise<DesignSkillBuild> {
  const source = new URL('docs/design-system/', root);
  const guidelines = await Deno.readTextFile(new URL('GUIDELINES.md', source));
  const themeIds: string[] = [];
  for await (const entry of Deno.readDir(new URL('themes/', source))) {
    if (!entry.isDirectory || entry.name.startsWith('_')) continue;
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name)) throw new Error(`Invalid theme id: ${entry.name}`);
    for (const file of ['DESIGN.md', 'SKILL.md']) {
      if (!(await Deno.stat(new URL(`themes/${entry.name}/${file}`, source))).isFile) {
        throw new Error(`Theme ${entry.name} needs a ${file} source file`);
      }
    }
    themeIds.push(entry.name);
  }
  if (!themeIds.length) throw new Error('No complete theme pairs found');
  const catalogue = guidelines.match(/^## 6\. [^\n]+\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
  if (!catalogue) throw new Error('GUIDELINES.md requires its theme catalogue');
  // Match the site's catalogue order, with newly added directories following alphabetically.
  const rank = (id: string) => {
    const index = catalogue.search(new RegExp(`\\| ${id}\\b`, 'i'));
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  themeIds.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const guidelinesSha256 = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(guidelines)),
  ).toHex();
  const links = themeIds.map((id) =>
    `| ${id} | [DESIGN.md](${SOURCE_ROOT}themes/${id}/DESIGN.md) | [SKILL.md](${SOURCE_ROOT}themes/${id}/SKILL.md) |`
  ).join('\n');
  const registry: Registry = JSON.parse(await Deno.readTextFile(new URL(REGISTRY_PATH, root)));
  const presets = registry.items.filter((item) =>
    item.type === 'registry:theme' && item.meta?.preset !== undefined
  );
  if (!presets.length) throw new Error('No registry theme presets found');
  const presetIds = presets.map((item) => item.name.replace(/^theme-/, ''));
  const presetLinks: string[] = [];
  for (const [index, item] of presets.entries()) {
    const id = presetIds[index];
    if (!/^[a-z][a-z0-9-]*$/.test(id) || item.name !== `theme-${id}`) {
      throw new Error(`Invalid registry theme preset: ${item.name}`);
    }
    const local: string[] = [];
    const published: string[] = [];
    for (const file of ['DESIGN.md', 'SKILL.md']) {
      const target = `.agents/skills/fresh-ui-theme-${id}/${file}`;
      const source = item.files?.find((entry) => entry.target === target)?.path;
      if (
        !source?.match(
          /^docs\/design-system\/(themes|token-presets)\/[a-z][a-z0-9-]*\/(DESIGN|SKILL)\.md$/,
        )
      ) {
        throw new Error(`Registry theme ${id} needs a canonical ${file} link`);
      }
      if (!(await Deno.stat(new URL(source, root))).isFile) {
        throw new Error(`Registry theme ${id} needs a ${file} source file`);
      }
      local.push(`\`${target}\``);
      published.push(`[${file}](${SOURCE_ROOT}${source.slice('docs/design-system/'.length)})`);
    }
    presetLinks.push(`| ${id} | ${local.join(' · ')} | ${published.join(' · ')} |`);
  }
  const skill = `---
name: netscript-design
description: 'Choose a Fresh UI theme and build or customize NetScript UI with its design language, token compatibility contract, quality method and self-audit. Use for visual design, theme selection and on-theme components; not backend architecture or generic Deno tooling.'
---

<!-- Generated from ${SOURCE_ROOT}GUIDELINES.md; source SHA-256: ${guidelinesSha256}. -->

# NetScript design

## Theme an app today

New Fresh apps start on **Studio Utility** (\`studio-utility\`): ink on neutral gray,
sharp corners, hairline rules and compact density. Preserve an app's chosen preset unless the
user asks to change it. Read [Theme your app](${THEMING_GUIDE})
(MCP/local-doc slug: \`web-layer/how-to/theme-your-app\`) for current commands and app wiring.

Switch the whole app with \`netscript ui:apply --preset <preset-id>\`, for example
\`netscript ui:apply --preset studio-cloud\`. In a workspace, add \`--app <name>\`.
The command records the preset in \`tokens.config.json\`, rebuilds generated assets, keeps
the semantic override file and installs the registry-owned DESIGN.md/SKILL.md pair under
\`.agents/skills/fresh-ui-theme-<preset-id>/\` relative to the Fresh app. Read that pair first.
In a scaffolded workspace, select \`apps/<app>/\` (the app selected by \`--app\`) before resolving
these paths. The shared skill can live at the workspace root while the theme pair lives inside
the app. In a standalone Fresh app, resolve them from its root. Do not resolve app paths relative
to this SKILL.md.
Use \`netscript init my-app --preset <preset-id>\` to choose a preset at scaffold time.
\`ui:add theme-<preset-id>\` alone does not select the app's token preset.

The current tokens v2 IDs and document links below come from the theme registry. A design
language name such as \`studio\` is not a preset ID; use \`studio-utility\` or another
listed Studio flavor. \`ns-one\` preserves the earlier default.

| Preset ID | Installed pair (paths relative to the selected Fresh app) | Published source pair |
| --- | --- | --- |
${presetLinks.join('\n')}

## Shared design rules

Use the [bundled canonical guidelines](references/GUIDELINES.md) for the shared rules. They are a
local snapshot of the design-system source. Their provisional/planned implementation notes
describe the original design plan; use Theme your app and the installed pair for current tokens
v2 behavior and CLI availability.

- **Choose a theme:** read §6 (theme catalogue) and §2.3 (preset design constraints), then the chosen
  theme's pair. Follow the user's goal and the current preset IDs above;
  the catalogue distinguishes faithful, inspired and own languages.
- **Build compatible UI:** read §1 (ownership), §2 (theme architecture) and §3 (compatibility
  contract), plus the chosen DESIGN.md and SKILL.md. Use semantic/component tokens and check
  light and dark schemes. Discover CLI/API operations through the installed NetScript tooling.
- **Check the result:** follow §4 (quality method), especially §4.5 (self-audit), and §5
  (anti-patterns). The chosen theme pair supplies the concrete visual rules and state coverage.
- **Create a theme:** follow §7 and the planned shipping boundary in §8; do not improvise a
  competing token contract.

## Theme specifications and procedures

\`ui:apply\` installs each preset's pair through its registry theme item. The local pair is the
source of truth for that app; this shared skill links to it without duplicating its contents.
When the pair is not installed, use the published preset links above. The eleven complete
design-language specifications are also listed below and linked by the
[Design system gallery](https://rickylabs.github.io/netscript/design-system/).

| Theme | Specification | Agent procedure |
| --- | --- | --- |
${links}
`;
  return {
    files: { [SKILL_PATH]: skill, [REFERENCE_PATH]: guidelines },
    guidelinesSha256,
    themeIds,
    presetIds,
  };
}

/** Check all owned files before writing any; drift mode leaves every output untouched. */
export async function generateDesignSkill(
  root: URL = ROOT,
  check = false,
): Promise<DesignSkillBuild> {
  const build = await buildDesignSkill(root);
  for (const [path, expected] of Object.entries(build.files)) {
    const url = new URL(path, root);
    if (check) {
      const actual = await Deno.readTextFile(url).catch((error) => {
        if (error instanceof Deno.errors.NotFound) return undefined;
        throw error;
      });
      if (actual !== expected) throw new Error(`${path} is stale; run deno task gen:design-skill`);
    } else {
      await Deno.mkdir(new URL('./', url), { recursive: true });
      await Deno.writeTextFile(url, expected);
    }
  }
  return build;
}

if (import.meta.main) {
  if (Deno.args.some((arg) => arg !== '--check')) throw new Error('Unknown argument');
  const build = await generateDesignSkill(ROOT, Deno.args.includes('--check'));
  console.log(JSON.stringify({
    outcome: 'PASS',
    files: Object.keys(build.files),
    themes: build.themeIds.length,
    presets: build.presetIds.length,
    guidelinesSha256: build.guidelinesSha256,
  }));
}
