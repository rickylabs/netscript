use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code: no `any`/casts/lint-ignores introduced.
- netscript-tools — scoped wrappers for focused check/lint/fmt; lock hygiene.

## D-119 — coordinator ruling: option (a), bounded fixture-parser repair

Your D-117 refusal and diagnosis were **correct and accepted** — thank you for not fabricating a
commit. The barrel was never stale; the real cause is exactly what you identified: the generator
emits `JSON.stringify(name)` (double quotes), but every real write path then runs
`formatGeneratedFiles` → `deno fmt --no-config --line-width 100 --single-quote`
(`format-generated-files.ts:17`), so the **on-disk** form is single-quoted, while
`prepare-flow-b-fixture.ts` parses the on-disk file expecting double quotes.

**Coordinator ruling: take option (a).** Relax the fixture's parse anchors to accept the
repo-formatted on-disk form. **Do NOT** change `--single-quote`, `formatGeneratedFiles`, the
generator's `JSON.stringify(name)` escaping, or any repo-wide formatting/generation convention.

## Scope (bounded — `prepare-flow-b-fixture.ts` parse anchors only)

In `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`, make these three
anchors quote-agnostic (accept `'` or `"`), so the fixture matches the real post-`deno fmt` output
and stays robust if the formatting convention is ever revisited:

1. **Line ~214** — `const workersExecutableMatch = /const (bg_\d+) = builder\.addExecutable\("workers",/`
2. **Line ~224** — `const workersConfigAnchor = '  if (config.BackgroundProcessors["workers"]?.Enabled !== false) {'`
3. **Line ~232** — `const workersSetAnchor = \`    backgroundProcessors.set("workers", ${workersBinding});\``

### Critical implementation constraint

`workersSetAnchor` is used **both** as a search target (`registerBackground.indexOf(workersSetAnchor, ...)`)
**and** as a literal `.replace()` target further down
(`workersBackgroundBlock.replace(workersSetAnchor, \`${usersReference}\n\n${workersSetAnchor}\`)`).
If you convert it to a regex, you must capture the **actually-matched substring** and use that exact
string for the replace — do not leave a regex source string being passed to `.replace()`, and do not
let the replacement silently no-op. Same care applies to `workersConfigAnchor`, which feeds
`lastIndexOf` and the block-slice start offset (`workersBackgroundIndex`) — the offset must remain
the true index of the matched anchor in `registerBackground`.

Keep every existing `throw new Error(...)` guard and its message intact — they must still fire if
the block genuinely is absent. Do not weaken the anchors into something that could match a
*different* processor's block (they must still be `workers`-specific and still bind the same
`bg_\d+` id).

## Verify before pushing

1. Focused type-check + lint + fmt on the touched file (scoped wrappers, `--ext ts`).
2. Run any focused unit tests covering this fixture if they exist.
3. **Static reproduction (no Aspire, no Docker):** scaffold a throwaway project
   (`netscript init <name> --db postgres --no-git --non-interactive`, then
   `netscript plugin install workers --name workers`), then execute the fixture's parse path against
   the generated `aspire/.helpers/register-background.mts` and confirm it now matches — i.e. it
   locates the workers block, binds `bg_0`, finds the config anchor and the set-anchor, and produces
   a `configuredBackgroundBlock` containing `services__users__http__0`. Paste the exact evidence.
   Clean up the throwaway scaffold afterward.
4. No PLAN-EVAL. No DeepSeek/OpenRouter rerun — the accepted IMPL-EVAL verdict for this PR stands.

## After this change

Commit (scoped to the fixture file + a run-dir note) and push. Report the exact new head, the
verification output, and confirm the worktree is clean. The coordinator will then request a fresh
runtime lease to prove `runtime.flow-b-fixture` passes end-to-end in the full `scaffold.runtime`
suite. **Do not start any runtime/Aspire/Docker process yourself.**
