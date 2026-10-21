# IMPL-EVAL brief — PR rickylabs/netscript#2407 (`orch/divybot-751`)

You are the **independent implementation evaluator** (separate session, different vendor family
from the generator, Claude Opus 5.5). Do not implement or edit product files. Your only write is
`.llm/runs/orch-divybot-751--2406-scaffold-chrome/evaluate.md`.

## What to evaluate

Upstream issue rickylabs/netscript#2406 items **1** (scaffold chrome on every page, opt-out
instead of an allowlist; `ui:add page` nav/hint) and **4** (`netscript-build` skill current for
`generate routes` / `ui:remove page`). Items 2 and 3 (theme-chain docs, MCP corpus, app
`AGENTS.md`) belong to the sibling PR #2408 by agreement — **out of scope here**; do not fail this
PR for them.

- Baseline: `a833dfa` (`main`, 0.0.8 cut). Head: the branch tip you check out (`git log -1`).
- Diff: `git diff a833dfa..HEAD -- packages skills` (generated `*.generated.ts` carriers are
  regenerated output; verify freshness via the check tasks, not by reading them).

## Read first

1. `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`,
   `.llm/harness/workflow/run-loop.md` §5 (Concept of Done), `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`,
   `.llm/harness/archetypes/SCOPE-frontend.md`, `.llm/harness/archetypes/SCOPE-docs.md`.
2. Run dir: `supervisor.md`, `research.md`, `plan.md`, `worklog.md` (Design + slices),
   `context-pack.md`, `drift.md`, `consumer-proof.md`, `consumer-chrome-evidence.txt`.
3. PR commit trail: `gh pr view 2407 --repo rickylabs/netscript --comments`.

## Independent checks to run (from the worktree root)

```bash
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all \
  packages/cli/src/kernel/application/ui/ packages/cli/src/public/features/ui/ \
  packages/cli/src/kernel/templates/app/ packages/cli/src/public/features/agent/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src --ext ts,tsx
deno task check:assets-barrel
deno task check:publish-assets
deno task quality:scan
deno task arch:check   # compare cli WARN count against baseline 64; FAIL must be 0
```

CLI files are excluded from root fmt/lint; the accepted method is
`.llm/tmp/fmt-751/no-exclude.json` (root lint rules + fmt options without include/exclude) with
`run-deno-lint.ts` / `run-deno-fmt.ts --config <it> --ext ts,tsx --file <each changed file>`
(recreate it from `deno.json` if absent).

## Questions to answer explicitly

1. Does every page outside `chromelessRoutePrefixes` get the top bar, while `/design` keeps only
   its SidebarShell, with a single `page` Partial in both branches?
2. Is `ui:add page` nav registration correct, idempotent, fmt-canonical in the generated workspace
   (`--line-width 100 --single-quote`), and safe on apps without `navigation.ts`?
3. Does `ui:remove page` remove exactly what `ui:add page` wrote (including the nav entry) and
   still refuse author-edited pages? Is the generator-binding normalization narrow enough?
4. Does the `styles.css` custom-tail preservation keep app CSS without duplicating imports?
5. Is every claim in `skills/netscript-build/SKILL.md` true against the code?
6. Concept of Done per slice (reachability, constants vs literals, one-line doc comments, one-file
   contributor path, folder cap after the `ui/page/` move).
7. Anything recorded as unproven (screenshots, `scaffold.runtime`) that you consider blocking.

## Output

Write `evaluate.md` with: route identity (model/provider/variant as you observe it), evaluated
head SHA, the gate table with your own results, findings (severity, file:line, why, fix), and one
verdict line: `VERDICT: PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT`. Then print the same verdict
line as your final message.
