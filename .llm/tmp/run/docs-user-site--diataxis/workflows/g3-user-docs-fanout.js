export const meta = {
  name: 'g3-user-docs-fanout',
  description: 'Group 3 user-docs fan-out: 21 reference pages (deno doc) + 25 standardized READMEs + Diataxis concept pages + verify',
  phases: [
    { title: 'Reference', detail: '21 per-unit deno doc reference pages (4 plugins fold their -core)' },
    { title: 'READMEs', detail: '25 standardized READMEs to the US-9 template', model: 'opus low' },
    { title: 'Concepts', detail: 'Diataxis tutorial/how-to/explanation content pages' },
    { title: 'Verify', detail: 'full site build + README checker + per-unit deno doc --lint tally + link scan' },
  ],
}

const WT = 'C:/Dev/repos/netscript-framework/.claude/worktrees/g3-user-site'

const COMMON = `You are authoring the NetScript EXTERNAL user documentation site (Group 3, run docs-user-site--diataxis, branch docs/user-site), under the netscript-harness SKILL + SCOPE-docs overlay. The scaffold + pilot are already DONE and green (Lume v2.5.4 site at docs/site/, Diataxis sections, README standard + checker, and @netscript/logger reference page + README already exist — use them as the worked example to match).

# CRITICAL WORKTREE RULE (read twice)
Your Edit/Write tools are HARD-PINNED to a DIFFERENT git worktree than the target. DO NOT use Edit or Write — they silently land in the wrong worktree. Create/modify files ONLY via the Bash tool using ABSOLUTE paths under:
  WT = ${WT}
Write with heredocs / printf / python via Bash. After every write, verify with \`ls -la\` and \`head\` on the absolute path. Run all build/lint/deno commands with \`cd ${WT} && ...\`.

# Worked examples to imitate (read them first, via Bash cat)
- Reference style: ${WT}/docs/site/reference/logger/index.md  (generated from \`deno doc\`, pure reference, front-matter title, cross-link back to /reference/)
- README standard: ${WT}/docs/site/_includes/readme-template.md  and the conformance checker ${WT}/.llm/tools/check-readme-standard.ts  and the already-conformant ${WT}/packages/logger/README.md
- Locked decisions: ${WT}/.llm/tmp/run/docs-user-site--diataxis/plan.md (US-1 Diataxis IA; US-2 reference FROM deno doc; US-7 base path https://rickylabs.github.io/netscript/; US-8 22 primary pages + 4 *-core folded as Internals subsections; US-9 standardized README + checker).

# Hard rules
- Get the EXACT JSR package name from each unit's deno.json \`name\` field — do NOT guess from the directory.
- Reference pages are generated FROM \`deno doc\` (run \`deno doc --json <each public export from deno.json exports map>\`); document all public exports. Pure reference register (US-1) — no tutorial prose.
- Off-limits: do NOT edit framework SOURCE under packages/*/src or plugins/*/src, the deno.json \`version\` field, scaffold-versions.ts, the catalog, or deno.lock. Editing a unit's README.md and writing docs/site/** ARE allowed (doc files).
- Do NOT git commit (the supervisor handles git). Write + verify files, then RETURN the structured result.`

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    unit: { type: 'string' },
    filesWritten: { type: 'array', items: { type: 'string' } },
    commandsRun: { type: 'array', items: { type: 'object', additionalProperties: true, properties: { cmd: { type: 'string' }, exit: { type: 'number' } }, required: ['cmd', 'exit'] } },
    ok: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['filesWritten', 'ok', 'notes'],
}

// 21 remaining reference units (logger pilot done). 4 plugins fold their -core.
const refPlain = ['aspire','cli','config','contracts','cron','database','fresh','fresh-ui','kv','plugin','prisma-adapter-mysql','queue','runtime-config','sdk','service','telemetry','watchers']
const refPlugins = [
  { slug: 'sagas',    pkg: 'plugins/sagas',    core: 'packages/plugin-sagas-core' },
  { slug: 'streams',  pkg: 'plugins/streams',  core: 'packages/plugin-streams-core' },
  { slug: 'triggers', pkg: 'plugins/triggers', core: 'packages/plugin-triggers-core' },
  { slug: 'workers',  pkg: 'plugins/workers',  core: 'packages/plugin-workers-core' },
]

// 25 remaining README units (logger done). All 26 minus logger.
const readmePkgs = ['aspire','cli','config','contracts','cron','database','fresh','fresh-ui','kv','plugin','plugin-sagas-core','plugin-streams-core','plugin-triggers-core','plugin-workers-core','prisma-adapter-mysql','queue','runtime-config','sdk','service','telemetry','watchers']
const readmePlugins = ['sagas','streams','triggers','workers']

const concepts = [
  { path: 'tutorials/getting-started.md', kind: 'tutorial', brief: 'A getting-started tutorial: scaffold a NetScript project and run it. Ground every step in real CLI commands — read packages/cli docs + the repo root README/AGENTS.md + docs/ for the actual scaffold flow. Learning-oriented (US-1 tutorial quadrant): a concrete happy path, not an API list.' },
  { path: 'how-to/add-a-plugin.md', kind: 'how-to', brief: 'A task-oriented how-to: add a first-party plugin (sagas/streams/triggers/workers) to an existing project. Ground in the real plugin add/scaffold commands and the plugin reference pages. Goal-oriented steps, cross-link to the plugin reference pages.' },
  { path: 'explanation/architecture.md', kind: 'explanation', brief: 'An explanation of the NetScript package/plugin architecture: archetypes, public surface, the contracts-first model. Ground in docs/architecture/doctrine/ and AGENTS.md. Understanding-oriented prose — no step lists. Cross-link to reference.' },
  { path: 'explanation/plugin-model.md', kind: 'explanation', brief: 'An explanation of the plugin model: how plugins relate to their *-core packages, runtime wiring, and registries. Ground in the doctrine + the plugin packages. Understanding-oriented. Cross-link to the plugin reference pages and add-a-plugin how-to.' },
]

const refWork = [
  ...refPlain.map((u) => () => agent(`${COMMON}

# REFERENCE PAGE for packages/${u}
1. \`cd ${WT} && cat packages/${u}/deno.json\` — read the \`name\` (exact JSR pkg) and the \`exports\` map.
2. For each public export, run \`cd ${WT} && deno doc --json packages/${u}/<export-file>\` (add --no-lock if it complains) and \`deno doc packages/${u}/<export-file>\` for the human view.
3. Author \`${WT}/docs/site/reference/${u}/index.md\` mirroring the logger page: front-matter title = the JSR name, sections grouping the exported symbols with signatures + one-line descriptions, sub-path exports noted, cross-link back to /reference/.
4. \`cd ${WT} && deno doc --lint packages/${u}/<main-export>\` and capture exit (A1 evidence).${u === 'fresh-ui' ? ' NOTE: fresh-ui currently has 7 known private-type-ref errors being fixed in PR #58 — record the exit but do NOT treat 7 as your failure; still produce the page.' : ' Expect exit 0.'}
Return SCHEMA: unit="${u}", filesWritten, commandsRun (include the deno doc --lint with exit), ok (page written + built-able), notes (symbols documented).`, { label: `ref:${u}`, phase: 'Reference', schema: SCHEMA, effort: 'medium' })),
  ...refPlugins.map((p) => () => agent(`${COMMON}

# REFERENCE PAGE for plugin ${p.slug} (FOLD its core per US-8)
1. \`cd ${WT} && cat ${p.pkg}/deno.json\` and \`cat ${p.core}/deno.json\` — read both \`name\` fields + \`exports\` maps.
2. Run \`deno doc --json\` on each public export of BOTH ${p.pkg} and ${p.core}.
3. Author ONE page \`${WT}/docs/site/reference/${p.slug}/index.md\`: front-matter title = the plugin's JSR name; primary sections document the public plugin (${p.pkg}); then an \`## Internals\` section documenting ${p.core} (the *-core) as a clearly-marked internals subsection (US-8). Cross-link back to /reference/.
4. \`cd ${WT} && deno doc --lint ${p.pkg}/<main-export> ${p.core}/<main-export>\` and capture exit (A1 evidence; expect 0).
Return SCHEMA: unit="${p.slug}(+${p.core})", filesWritten, commandsRun, ok, notes (both surfaces documented).`, { label: `ref:${p.slug}+core`, phase: 'Reference', schema: SCHEMA, effort: 'medium' })),
]

const readmeWork = [
  ...readmePkgs.map((u) => () => agent(`${COMMON}

# STANDARDIZED README for packages/${u} (US-9)
1. Read the template ${WT}/docs/site/_includes/readme-template.md and the checker rules in ${WT}/.llm/tools/check-readme-standard.ts and the conformant ${WT}/packages/logger/README.md.
2. Get the exact JSR name: \`cd ${WT} && cat packages/${u}/deno.json\` (\`name\` field). Learn the real public API: \`deno doc packages/${u}/<main export>\`.
3. Rewrite \`${WT}/packages/${u}/README.md\` to conform: H1 = the JSR name, one-line purpose, \`## Install\` with \`deno add jsr:<name>\`, \`## Quick example\` with a REAL ts snippet using actual exports (do not invent), \`## Docs\` linking the reference page (https://rickylabs.github.io/netscript/reference/${u}/ or the *-core's owning plugin page if folded) + the concepts site.
4. \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty packages/${u}/README.md\` and capture exit (expect 0).
Return SCHEMA: unit="${u}", filesWritten, commandsRun (checker exit), ok (checker exit 0), notes.`, { label: `readme:${u}`, phase: 'READMEs', schema: SCHEMA, effort: 'low' })),
  ...readmePlugins.map((u) => () => agent(`${COMMON}

# STANDARDIZED README for plugins/${u} (US-9)
1. Read the template + checker + the conformant logger README.
2. \`cd ${WT} && cat plugins/${u}/deno.json\` for the exact JSR name; \`deno doc plugins/${u}/<main export>\` for the real API.
3. Rewrite \`${WT}/plugins/${u}/README.md\` to conform (same shape as above), reference link → https://rickylabs.github.io/netscript/reference/${u}/ .
4. \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty plugins/${u}/README.md\` and capture exit (expect 0).
Return SCHEMA: unit="${u}", filesWritten, commandsRun, ok, notes.`, { label: `readme:${u}`, phase: 'READMEs', schema: SCHEMA, effort: 'low' })),
]

const conceptWork = concepts.map((c) => () => agent(`${COMMON}

# DIATAXIS ${c.kind.toUpperCase()} PAGE — ${c.path}
${c.brief}
Author \`${WT}/docs/site/${c.path}\` with front-matter title, the correct Diataxis register for a ${c.kind}, and cross-links to the relevant reference pages and sibling sections. ACCURACY IS MANDATORY: read the real repo sources you cite (cli docs, AGENTS.md, docs/architecture/doctrine/, the relevant package deno.json/mod) and do NOT invent commands, flags, or exports. If unsure of an exact command, describe the step generically rather than fabricating. Update the matching section index (e.g. docs/site/${c.kind === 'how-to' ? 'how-to' : c.kind + 's'}/index.md) to link this page if appropriate.
Return SCHEMA: unit="${c.path}", filesWritten, commandsRun (any deno doc you ran to verify claims), ok, notes (sources grounded in).`, { label: `concept:${c.path}`, phase: 'Concepts', schema: SCHEMA, effort: 'medium' }))

const results = await parallel([...refWork, ...readmeWork, ...conceptWork])

phase('Verify')
const verify = await agent(`${COMMON}

# VERIFY the full fan-out — run from ${WT}, report each exit precisely
1. \`cd ${WT} && deno task build\` — the full site (all reference + concept pages) builds into _site. Capture exit + the "Site built" line + file count.
2. \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty\` — the default 26-unit scan. Capture exit; it should now be 0 (all standardized). List any unit still non-conformant with the precise rule it fails.
3. Per-unit A1 tally: for EACH of the 26 units, run \`deno doc --lint <its main export>\` and record pass(0)/fail. The 22 packages/ are: aspire cli config contracts cron database fresh fresh-ui kv logger plugin plugin-sagas-core plugin-streams-core plugin-triggers-core plugin-workers-core prisma-adapter-mysql queue runtime-config sdk service telemetry watchers ; the 4 plugins/ are: sagas streams triggers workers. Expect ALL 0 EXCEPT fresh-ui (7 known errors, fixed in PR #58 — note it, do not count as a fan-out regression). Report the tally as "N/26 lint-clean (fresh-ui excepted)".
4. Link scan: grep hrefs in _site/**/*.html and verify each internal target (and #anchor where present) resolves to a generated file. Report any broken internal links.
Return SCHEMA: unit="VERIFY", filesWritten=[], commandsRun (build + checker + the lint tally summarized + link scan), ok (build exit 0 AND README checker 0 AND all-but-fresh-ui lint-clean AND no broken internal links), notes = the A1 tally and any defects with exact paths. This is the go/no-go for the Group 3 IMPL-EVAL.`, { label: 'g3-verify-fanout', phase: 'Verify', schema: SCHEMA, effort: 'medium' })

return { counts: { reference: refWork.length, readmes: readmeWork.length, concepts: conceptWork.length }, results, verify }
