export const meta = {
  name: 'g3-user-docs-scaffold-pilot',
  description: 'Group 3 user-docs: stand up Lume site + README standard + prove deno doc reference pipeline on one pilot unit',
  phases: [
    { title: 'Scaffold', detail: 'Lume site skeleton + README standard/checker' },
    { title: 'Pilot', detail: 'reference page + README for @netscript/logger' },
    { title: 'Verify', detail: 'deno task build + checkers' },
  ],
}

const WT = 'C:/Dev/repos/netscript-framework/.claude/worktrees/g3-user-site'

const COMMON = `You are authoring the NetScript EXTERNAL user documentation site (Group 3, run docs-user-site--diataxis, branch docs/user-site), under the netscript-harness SKILL + SCOPE-docs overlay.

# CRITICAL WORKTREE RULE (read twice)
Your Edit/Write tools are HARD-PINNED to a DIFFERENT git worktree than the target. DO NOT use Edit or Write — they will silently land in the wrong worktree. Create and modify files ONLY via the Bash tool using ABSOLUTE paths under:
  WT = ${WT}
Use heredocs / printf / python via Bash to write files under WT. After every write, verify with \`ls -la\` and \`head\` on the absolute path. Run all build/lint/deno commands with \`cd ${WT} && ...\`.

# Context to read first (via Bash cat, absolute paths under WT)
- ${WT}/.llm/tmp/run/docs-user-site--diataxis/plan.md  (esp. Locked Decisions US-1..US-9 and ## Commit Slices)
- ${WT}/.llm/tmp/run/docs-user-site--diataxis/research.md

# Locked decisions that bind you
- US-1 Diátaxis IA: tutorials / how-to / reference / explanation, separated + cross-linked.
- US-2 reference generated from \`deno doc\` (not hand-written prose).
- US-3 Lume static-site generator; deploy target GitHub Pages.
- US-7 Pages base path = https://rickylabs.github.io/netscript/ — Lume \`location\` MUST be set to this exact URL or all asset/links break.
- US-8 22 primary reference pages; 4 *-core fold under their public plugin (not this pilot's concern).
- US-9 standardized README template, generated + checker-enforced.

# Off-limits (hard)
- Do NOT edit framework SOURCE under packages/*/src or plugins/*/src, version pins, scaffold-versions.ts, or catalog entries. (Editing a package's README.md IS allowed — it is a doc file. Editing root deno.json to add a doc TASK is allowed.)
- Wrap, don't reinvent: use Lume + @std + deno doc. No custom SSG.

# Your output
Do NOT git commit (the supervisor handles git). Write files under WT, verify they exist, and RETURN the structured result described in your slice. Be precise about exact paths written and any command exit codes.`

phase('Scaffold')

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    filesWritten: { type: 'array', items: { type: 'string' } },
    commandsRun: { type: 'array', items: { type: 'object', additionalProperties: true, properties: { cmd: { type: 'string' }, exit: { type: 'number' }, note: { type: 'string' } }, required: ['cmd', 'exit'] } },
    notes: { type: 'string' },
    ok: { type: 'boolean' },
  },
  required: ['filesWritten', 'ok', 'notes'],
}

const lume = agent(`${COMMON}

# SLICE G3-0 — Lume site skeleton + Diátaxis nav + Pages base path
Stand up a Lume site under ${WT}/docs/site/ :
1. \`docs/site/_config.ts\` — import Lume (\`import lume from "lume/mod.ts";\`), create the site with \`location: new URL("https://rickylabs.github.io/netscript/")\` (US-7), output to \`_site\`. Add sensible plugins only if needed (keep minimal). Pin Lume via a JSR/deno.land URL import that resolves offline-safe; prefer \`https://deno.land/x/lume@v2/mod.ts\` or the current stable — verify it imports by running the build.
2. Diátaxis section scaffolding with index pages: \`docs/site/index.md\` (landing), \`docs/site/tutorials/index.md\`, \`docs/site/how-to/index.md\`, \`docs/site/reference/index.md\`, \`docs/site/explanation/index.md\`. Each gets a short front-matter title + one-paragraph intro and cross-links to the others (US-1). Keep nav legible.
3. A base layout \`docs/site/_includes/layouts/base.vto\` (or .njk) with a nav listing the 4 Diátaxis sections, used by the index pages.
4. Add a \`build\` task to ${WT}/deno.json: \`"build": "cd docs/site && deno run -A lume/cli.ts"\` (or the correct Lume CLI invocation for the pinned version). Do NOT remove or reorder existing tasks; add yours.
5. Run \`cd ${WT} && deno task build\` and confirm \`docs/site/_site\` is produced. Capture the exit code. If the Lume import/version is wrong, fix it until the build succeeds.

Return the schema: filesWritten (absolute or WT-relative paths), commandsRun (the build with its exit), ok (true only if _site built), notes (the exact Lume version/import used + the build task string).`, { label: 'G3-0:lume-skeleton', phase: 'Scaffold', schema: SCHEMA, effort: 'medium' })

const readmeStd = agent(`${COMMON}

# SLICE G3-1 — README standard template + conformance checker
1. Define the standardized README shape (US-9): H1 title \`# @netscript/<pkg>\`, a one-line purpose, an \`## Install\` section with \`deno add jsr:@netscript/<pkg>\`, a \`## Quick example\` fenced ts block, and a \`## Docs\` section linking to the reference page and the concepts site. Capture this as a documented template file at ${WT}/docs/site/_includes/readme-template.md (a commented skeleton with \`<placeholders>\`).
2. Write a checker \`${WT}/.llm/tools/check-readme-standard.ts\` (Deno, --allow-read, --no-lock-friendly) that, given a list of unit README paths (or a default glob of packages/*/README.md + plugins/*/README.md), validates each contains: an H1 starting with \`# @netscript/\`, an \`## Install\` section containing \`deno add jsr:@netscript/\`, a \`## Quick example\` (or \`## Quick start\`) section with a fenced code block, and a \`## Docs\`/\`## Documentation\` section with at least one link. Emit \`--pretty\` human output and exit 1 on any non-conformant README, 0 otherwise. Support \`--json\`. Mirror the style/arg-parsing of ${WT}/.llm/tools/check-internal-doc-links.ts (read it first).
3. Add a task to ${WT}/deno.json: \`"docs:readme:check": "deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty"\`. Do not disturb existing tasks.
4. Sanity-run \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --help\` (or with no args) to confirm it compiles/parses. Capture exit.

Return the schema. ok=true only if the checker compiles and runs. notes = the exact conformance rules enforced.`, { label: 'G3-1:readme-standard', phase: 'Scaffold', schema: SCHEMA, effort: 'low' })

const scaffold = await parallel([() => lume, () => readmeStd])

phase('Pilot')

const pilotRef = agent(`${COMMON}

# SLICE G3-2 (PILOT) — reference page for @netscript/logger from deno doc
The scaffold is in place (docs/site/ exists, reference/ section present). Produce the reference page for ONE unit, @netscript/logger, to PROVE the pipeline:
1. Inspect its export map: \`cd ${WT} && cat packages/logger/deno.json\` (exports: \`.\` -> ./mod.ts, ./middleware, ./orpc).
2. For the main export, run \`cd ${WT} && deno doc --json packages/logger/mod.ts\` and also \`deno doc packages/logger/mod.ts\` (human) to understand the public surface. (deno doc may need --no-lock; add it if it complains.)
3. Author \`${WT}/docs/site/reference/logger/index.md\` — a reference page (US-2: generated FROM deno doc, reference-style: list exported symbols, signatures, and a one-line description each; link to sub-path exports). Pure reference (no tutorial prose, US-1). Front-matter title \`@netscript/logger\`. Cross-link back to reference/index.md.
4. Run \`cd ${WT} && deno doc --lint packages/logger/mod.ts\` and capture the exit (expect 0 — logger is one of the 25 clean units). This is the A1 gate evidence for this unit.
5. Re-run \`cd ${WT} && deno task build\` to confirm the new page builds into _site.

Return the schema. commandsRun must include the \`deno doc --lint\` (with exit) and the build (with exit). ok=true only if lint exit 0 AND build succeeded. notes = the symbols documented + how you mapped deno doc JSON to the page.`, { label: 'G3-2:pilot-ref-logger', phase: 'Pilot', schema: SCHEMA, effort: 'medium' })

const pilotReadme = agent(`${COMMON}

# SLICE G3-3 (PILOT) — standardized README for @netscript/logger
Using the README standard (read ${WT}/docs/site/_includes/readme-template.md and ${WT}/.llm/tools/check-readme-standard.ts to know the exact rules):
1. Read the current ${WT}/packages/logger/README.md (if any) and the logger public surface (\`cd ${WT} && deno doc packages/logger/mod.ts\`).
2. Rewrite ${WT}/packages/logger/README.md to conform: \`# @netscript/logger\`, one-line purpose, \`## Install\` with \`deno add jsr:@netscript/logger\`, \`## Quick example\` with a real ts snippet using the actual public API, \`## Docs\` linking to the reference page (../../docs/site/reference/logger/ or the published site path) and the concepts site. Keep it accurate to the real API — do not invent exports.
3. Run the checker against just this file: \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty\` (or with a path arg if supported) and capture exit.

Return the schema. ok=true only if the README conforms (checker passes for logger). notes = any deviation.`, { label: 'G3-3:pilot-readme-logger', phase: 'Pilot', schema: SCHEMA, effort: 'low' })

const pilot = await parallel([() => pilotRef, () => pilotReadme])

phase('Verify')

const verify = await agent(`${COMMON}

# VERIFY — prove the whole pilot pipeline is green
Run, from ${WT}, and report each exit code precisely:
1. \`cd ${WT} && deno task build\`  (Lume site builds, _site present)
2. \`cd ${WT} && ls docs/site/_site/reference/logger\`  (pilot reference page rendered)
3. \`cd ${WT} && deno doc --lint packages/logger/mod.ts\`  (A1 gate for the pilot unit, expect 0)
4. \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty\`  (README standard; the pilot logger README should conform — other units may not exist/conform yet, note which fail)
5. \`cd ${WT} && deno run --no-lock --allow-read .llm/tools/check-internal-doc-links.ts --pretty\` is NOT for this site; skip.

Summarize: did the Lume build succeed, did the pilot reference render, is logger lint-clean, does the README checker work. List anything broken with the exact error. This is the go/no-go signal for fanning out to the remaining 21 reference pages + 25 READMEs.

Return the schema with commandsRun covering all 4 checks and ok=true only if build + pilot render + logger lint(0) all pass.`, { label: 'G3-verify', phase: 'Verify', schema: SCHEMA, effort: 'medium' })

return { scaffold, pilot, verify }
