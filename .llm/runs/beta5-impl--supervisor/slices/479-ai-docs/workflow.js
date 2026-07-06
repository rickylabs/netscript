export const meta = {
  name: 'ai-reference-docs-479',
  description: 'Author AI-stack reference pages (reference/ai, plugin-ai, plugin-ai-core) + cross-link edits for issue #479',
  phases: [
    { title: 'Author', detail: 'one Opus agent per package reference page', model: 'opus' },
    { title: 'Crosslink', detail: 'cross-link edit list from concept pages', model: 'sonnet' },
  ],
}

// Data embedded as consts (Workflow args do not thread reliably).
const REPO = 'C:/Dev/repos/netscript-framework'

const COMMON = `
use harness

## SKILL
Read these repo skill files first (under ${REPO}/.agents/skills/<name>/SKILL.md): netscript-harness, netscript-doctrine, jsr-audit, deno-fresh (only if you touch fresh surfaces), netscript-deno-toolchain.

You are a documentation-authoring agent for rickylabs/netscript issue #479, working READ-ONLY
against the checkout at ${REPO} (do NOT edit, write, commit, or push any file — your final
message IS the deliverable). Deno is available; run read-only commands (deno doc, deno task)
from that directory as needed.

Ground rules:
- The published export map is the source of truth: use \`deno doc <module>\` and
  \`deno doc --filter <symbol>\` against the package's deno.json exports. Never invent an API;
  verify EVERY symbol, option name, default value, and config key against deno doc or source.
- Match the existing reference-page shape EXACTLY: read
  ${REPO}/docs/site/reference/workers/index.md and
  ${REPO}/docs/site/reference/sagas/index.md first — mirror their front matter fields, heading
  structure (public surface, config, scaffolded output, doctor checks, examples), tone, and
  Lume/Vento component usage.
- Lume/Vento landmines (build-breaking): never use the \`function\` keyword inside any
  {{ comp ... }} tag argument (arrow functions only); keep every {{ comp }} tag on one line;
  balance every tag; do not introduce raw JSX. When unsure, use plain Markdown instead of a
  component.
- Docs voice: factual, no "honest/honestly" or candor-announcing framing; one clean factual
  callout where a limitation matters.
- Examples must be real: prefer code shapes proven by the package's own tests or the CLI E2E
  suites (search packages/<pkg>/tests and .llm/tools/e2e). Cite config keys exactly as the
  code reads them.
`

const PKGS = [
  {
    slug: 'ai',
    label: 'reference/ai',
    detail: `Author ${REPO}/docs/site/reference/ai/index.md — the \`@netscript/ai\` engine package
(packages/ai). Cover: package purpose (provider-agnostic AI engine), the public surface from its
export map (providers/adapters such as the OpenAI-compatible + Anthropic providers, embeddings,
model/provider ports), configuration (env keys the code actually reads), and usage examples.
This is a library reference (no scaffolded output / doctor sections unless the package genuinely
has them — check; if absent, omit those sections rather than fabricating).`,
  },
  {
    slug: 'plugin-ai',
    label: 'reference/plugin-ai',
    detail: `Author ${REPO}/docs/site/reference/plugin-ai/index.md — plugins/ai
(\`@netscript/plugin-ai\`). Cover: plugin surface, \`netscript plugin add ai\` variants (default /
--persist-threads / --mcp) — verify each variant's actual effect in the CLI source
(packages/cli) and plugin scaffolding, required config (ANTHROPIC_API_KEY and any others the
code reads), doctor behavior (what \`netscript doctor\` checks for this plugin), scaffolded
output layout, and endpoint/usage examples. Flagship parity (#388) means this page must meet
the workers/sagas bar.`,
  },
  {
    slug: 'plugin-ai-core',
    label: 'reference/plugin-ai-core',
    detail: `Author ${REPO}/docs/site/reference/plugin-ai-core/index.md —
\`@netscript/plugin-ai-core\` (packages/plugin-ai-core). Cover: \`aiContractV1\` / \`AiRouter\`,
the \`/v1/ai\` binder, the SSE chat contract (event shapes, headers), how plugin-ai builds on it,
and contract-level examples. Mirror how reference/plugin-auth-core/index.md (if present) or the
closest -core reference page structures a contract package.`,
  },
]

function authorPrompt(p) {
  return `${COMMON}

## Task
${p.detail}

## Output contract
Return ONLY the complete file content for the page (front matter + body), ready to be written
verbatim to the target path. No surrounding commentary, no code fences around the whole file.`
}

const CROSSLINK_SCHEMA = {
  type: 'object',
  required: ['edits'],
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'old_string', 'new_string', 'why'],
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          old_string: { type: 'string', description: 'exact unique existing text' },
          new_string: { type: 'string', description: 'replacement text containing the new cross-link(s)' },
          why: { type: 'string' },
        },
      },
    },
  },
}

const crosslinkPrompt = `${COMMON}

## Task
Three new reference pages are being added at docs/site/reference/ai/index.md,
docs/site/reference/plugin-ai/index.md, docs/site/reference/plugin-ai-core/index.md.
Produce the MINIMAL cross-link edit set so readers can reach them:
1. From the AI concept pages under ${REPO}/docs/site/ai/ (engine, durable-chat, chat-ui) and
   ${REPO}/docs/site/capabilities/ai.md — add "Reference" links where the sibling capability
   pages (e.g. capabilities for workers/sagas) link to their reference pages; mirror that
   exact convention.
2. Any reference index/nav listing that enumerates reference sections (check
   docs/site/reference/index.md or _data files for a nav registry — if navigation is
   data-driven, the edit belongs in the data file).
Respect the IA direction of issue #433 (read it via its mention in docs if present; do not
restructure IA — links only). Each edit must be a surgical old_string→new_string replacement
with old_string EXACTLY as in the file (byte-accurate, unique).`

phase('Author')
const results = await parallel([
  ...PKGS.map((p) => () =>
    agent(authorPrompt(p), { label: `author:${p.slug}`, phase: 'Author', model: 'opus', effort: 'medium' })
  ),
  () => agent(crosslinkPrompt, { label: 'crosslink', phase: 'Crosslink', model: 'sonnet', effort: 'medium', schema: CROSSLINK_SCHEMA }),
])

const [aiBody, pluginAiBody, pluginAiCoreBody, crosslink] = results
return {
  pages: [
    { path: 'docs/site/reference/ai/index.md', body: aiBody },
    { path: 'docs/site/reference/plugin-ai/index.md', body: pluginAiBody },
    { path: 'docs/site/reference/plugin-ai-core/index.md', body: pluginAiCoreBody },
  ],
  crosslink,
}
