/** Generate the consumer design skill from canonical design sources; --check never writes. */
const ROOT = new URL('../../../', import.meta.url);
const SOURCE_ROOT =
  'https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/';
const SKILL_PATH = 'skills/netscript-design/SKILL.md';
const REFERENCE_PATH = 'skills/netscript-design/references/GUIDELINES.md';

/** Owned output files and source provenance, shared by generation and the read-only check. */
export interface DesignSkillBuild {
  files: Readonly<Record<string, string>>;
  guidelinesSha256: string;
  themeIds: readonly string[];
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
  const skill = `---
name: netscript-design
description: 'Choose a Fresh UI theme and build or customize NetScript UI with its design language, token compatibility contract, quality method and self-audit. Use for visual design, theme selection and on-theme components; not backend architecture or generic Deno tooling.'
---

<!-- Generated from ${SOURCE_ROOT}GUIDELINES.md; source SHA-256: ${guidelinesSha256}. -->

# NetScript design

Use the [bundled canonical guidelines](references/GUIDELINES.md) for the shared rules. They are a
local snapshot of the design-system source, not a second hand-maintained policy.

- **Choose a theme:** read §6 (theme catalogue) and §2.3 (supported presets), then the chosen
  theme's pair below. Follow the user's goal and the documented default/preset constraints;
  the catalogue distinguishes faithful, inspired and own languages.
- **Build compatible UI:** read §1 (ownership), §2 (theme architecture) and §3 (compatibility
  contract), plus the chosen DESIGN.md and SKILL.md. Keep provisional and planned capabilities
  distinct from installed framework behavior. Discover CLI/API operations through the installed
  NetScript tooling rather than assuming future registry commands already exist.
- **Check the result:** follow §4 (quality method), especially §4.5 (self-audit), and §5
  (anti-patterns). The chosen theme pair supplies the concrete visual rules and state coverage.
- **Create a theme:** follow §7 and the planned shipping boundary in §8; do not improvise a
  competing token contract.

## Theme specifications and procedures

If the chosen theme is installed under \`.agents/skills/fresh-ui-theme-<id>/\`, read that local
DESIGN.md/SKILL.md pair. Installing these pairs is registry-v2 work; this skill does not claim to
install them. Otherwise use the published sources below, also linked by the
[Design system gallery](https://rickylabs.github.io/netscript/design-system/).

| Theme | Specification | Agent procedure |
| --- | --- | --- |
${links}
`;
  return {
    files: { [SKILL_PATH]: skill, [REFERENCE_PATH]: guidelines },
    guidelinesSha256,
    themeIds,
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
    guidelinesSha256: build.guidelinesSha256,
  }));
}
