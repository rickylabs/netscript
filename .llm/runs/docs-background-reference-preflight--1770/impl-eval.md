# IMPL-EVAL — docs-background-reference-preflight--1770 (PR #1772)

## Verdict

`FAIL_FIX`

The plan remains valid and almost everything verifies: both error templates match the shipped
source character-for-character, the timing/fail-fast/two-causes/not-under-load claims are all
proven against the generator and its tests, scope and provenance are honest, and every claimed
gate reproduces green at the evaluated head. One prose sentence fails the declared-vs-required
lens this evaluation was dispatched to apply (finding B1), an external review thread raising the
same defect stands unanswered (merge-blocked by repo policy), and the PR body's "Harness
evaluation" section presents a non-formal IMPL-EVAL as settled. The fix is one clause plus an
asset regeneration and PR-body refresh.

## Evaluated head

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1770`, branch
  `docs/background-reference-preflight`
- HEAD: `d5ba40ebd74da447d2a85885828fbd301240a065` (verified `git rev-parse HEAD`); base
  `origin/main` `3e5cbabf`. Tree clean before and after evaluation
  (`git status --porcelain` empty).
- Commits: `99ba2bf3` (prose + run artifacts) → `d5ba40eb` (four derived assets only — verified
  `git show --name-only d5ba40eb` lists exactly `prose.json.gz`, `provenance.json`,
  `agent-docs.generated.ts`, `publish-assets.generated.ts`).

## Evaluator identity

- Requested route: Claude · Anthropic · Fable 5 · medium (`formal_impl_evaluation`, native
  opposite-family for Codex-authored work).
- Observed: model-confirmed `claude-fable-5`; effort as-requested (medium) — effort is not
  introspectable from inside a session, so this is not asserted as a route match.
- Generator ≠ evaluator holds: generator was Codex · OpenAI · `gpt-5.6-sol` · medium, thread
  `01a052ea-0462-7e83-b427-d53f034ef913` (`codex-thread-ids.md`); this is a separate Claude
  session.

## Character-level template comparison

Source of truth:
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`.

Emitted templates (only `${name}`/`${ref}` substituted, at **generation time**):

- `Background processor configuration error: '${name}' could not resolve service reference '${ref}' HTTP endpoint.`
- `Background processor configuration error: '${name}' could not resolve plugin reference '${ref}' HTTP endpoint.`

Page quotes (entity-decoded, whitespace-collapsed from the rendered
`_site/orchestration-runtime/how-to/deploy-local-aspire/index.html` built at this head):

- `Background processor configuration error: '<processor>' could not resolve service reference '<ref>' HTTP endpoint.`
- `Background processor configuration error: '<processor>' could not resolve plugin reference '<ref>' HTTP endpoint.`

Programmatic comparison (substituting `<processor>`/`<ref>` for `${name}`/`${ref}`): **exact match
for both**, service and plugin variants kept distinct, no invented variant. The page states the
placeholders are substituted with configured names — honest. (See advisory A2 on the tense of
"the generated code substitutes".)

## The four claims

1. **Timing — VERIFIED.** The generator emits the preflight block
   (`// Declared reference preflight — fail before processor registration`) before the
   `builder.addExecutable(...)` line for the same processor.
   `generate-register-background_test.ts` asserts it at runtime: `assertRejects` with
   `builder.registrations` still `[]` — "addExecutable must not run before reference preflight" —
   and a static assertion that both message templates appear before the `addExecutable` index in
   the emitted source.
2. **"A declaration is required configuration" — VERIFIED with one scope qualifier missing (B1).**
   The source comment is verbatim: "A declared reference is required configuration, so missing
   resources and resources without an HTTP endpoint are equally fatal." The behaviour matches:
   the throw is unconditional when the endpoint is unresolved. Not editorialising — but the
   enforcement is scoped to processors whose registration block runs (`Enabled !== false`); see
   B1.
3. **Two causes collapse — VERIFIED.** `await _services.get('${ref}')?.getEndpoint('http')`
   (resp. `_plugins`): a missing map entry short-circuits to `undefined`; a present resource whose
   `getEndpoint('http')` resolves falsy hits the same `if (!endpoint) throw`. The test suite
   proves both paths produce the **identical** message (`endpointResource(undefined)` vs absent
   map entry, per kind). The repo-wide contract types `getEndpoint` as
   `Promise<string | undefined> | string | undefined` (apps template `EndpointProvider`), and
   `wireServiceReferences` treats falsy the same way — consistent.
4. **"Not a processor failing under load" — VERIFIED.** The throw occurs in the AppHost's
   registration pass before `addExecutable`; the processor executable is never registered, never
   spawned. It is a startup configuration error.

## Modal-verb sweep (declared-vs-required lens)

- "**cannot** resolve" (heading) — accurate: resolution failure is fatal at startup.
- "preflights **every** declared service and plugin reference" — **overstated** (B1): the entire
  registration block, preflight included, sits inside
  `if (config.BackgroundProcessors['<name>']?.Enabled !== false)`. A disabled processor's declared
  references are never preflighted and never fatal.
- "A declaration **is required** configuration" — enforced-as-required only for processors that
  register (B1); unqualified as written.
- "**fails fast**" — accurate: throw precedes registration; `aspire start` aborts.
- "when the resource is missing **or** ... has no `http` endpoint" — accurate; both collapse to
  the same message (claim 3). Endpoint name literally `http` — accurate.
- "startup configuration error, **not** a processor failing under load" — accurate (claim 4).
- "The generated code **substitutes** the configured ... names" — benign but loose (A2).

## Blocking findings

- **B1 — "every declared" / unqualified "required configuration" overstate enforcement scope.**
  Declared references on a processor configured `Enabled: false` are neither preflighted nor
  fatal — the generator skips the whole block. The page's unqualified universal can mislead an
  operator into believing startup validates all declarations (e.g. trusting boot to have
  validated a disabled processor's references before enabling it in production). This is exactly
  the declared-vs-required defect class this lane shipped earlier today. Independently raised by
  the `augmentcode[bot]` inline review (severity: low) on
  `deploy-local-aspire.md:176` — that thread is **current, unresolved, and unanswered**, which
  the repo's review-thread gate treats as merge-blocking on its own. Fix: one clause (e.g.
  "preflights every declared service and plugin reference of each processor it registers" /
  "each enabled processor"), then regenerate the four derived assets as a new derived-only
  commit and answer the thread.
- **B2 — PR body presents a non-formal IMPL-EVAL as settled.** The body and a phase comment
  assert "IMPL-EVAL: PASS — native Fable 5 medium, session `f9b16325-…`" at this head. The
  milestone supervisor dispatched **this** session as the formal IMPL-EVAL; the run dir contains
  no `evaluate.md`/IMPL-EVAL artifact backing the earlier claim, and the evidence trail for both
  earlier evaluator passes lives only in artifacts authored by the implementation lane (see
  process observations). Whatever that session was, it is not the formal verdict, and the formal
  verdict at this head is `FAIL_FIX`. The Harness-evaluation section and acceptance-evidence
  entries 4–5 must be corrected to cite the formal evaluation at the fixed head.

## Advisories (non-blocking)

- **A1 — Raw corpus splits the quoted message.** In `prose.json.gz` the extracted prose stores
  the template as `…could not resolve service\n>   reference '<ref>' HTTP endpoint.` (source
  100-column wrap + callout continuation prefix), so an exact substring search of the full
  one-line message over the raw corpus fails. The distinctive head
  `Background processor configuration error: '<processor>' could not resolve service|plugin` and
  the tail `reference '<ref>' HTTP endpoint.` each survive intact, and the rendered HTML
  collapses to the exact message. Pre-existing extractor/format behaviour, disclosed in the PR
  body; not chargeable. If the fix cycle rewords the sentence anyway, consider placement that
  keeps `resolve service reference` unsplit if the 100-column rule allows.
- **A2 — "The generated code substitutes …"** — substitution happens at generation time; the
  generated file contains the already-substituted literal. The reading "in the generated code,
  the real names appear in place of the placeholders" is correct, so this is a tightening
  opportunity only.
- **A3 — `docs:readme:check` baseline red confirmed not chargeable.** Reproduced at this head:
  exit 1 solely for `packages/bench/README.md` missing `## Install`; that file is not in the
  diff, so the failure is identical at base `3e5cbabf`. Agrees with the PR's claim.
- **A4 — `diagrams:check` N/A confirmed from the diff.** It is a `docs/site/_diagrams/*.mmd`
  regeneration/drift gate; the diff touches no `.mmd`/`.svg` and the edited page references no
  diagrams (0 matches).
- **A5 — PR body template conformance.** No `## Scope` section (the `Closes #1770` in
  `## Summary` still auto-closes) and no `## Definition of Done` checklist. No box is falsely
  ticked — there are no boxes — but the netscript-pr template makes DoD the authoritative
  completion section and warns against durable completion claims living only outside it. Add a
  truthful DoD checklist in the fix cycle.

## Process observations

- `plan-eval.md` (PASS) was committed by the implementation commit `99ba2bf3` — the
  implementation thread produced/recorded it itself, and the claimed prior IMPL-EVAL comment was
  posted from the same lane before this formal dispatch. Evaluator dispatch belongs to the
  supervisor ("a sub-agent never auto-dispatches one"). Recorded as a process deviation; no
  verdict inherited from either artifact.
- I re-derived `plan-eval.md`'s load-bearing reasoning independently and it **holds**: D1
  placement, D2 template quoting, D3 timing, D4 cause collapse, and D5 two-commit provenance all
  check out against the source and tests. Its PASS was, on the merits, correct for the plan.
- `supervisor.md`/`codex-thread-ids.md` record requested=observed route for the generator
  (gpt-5.6-sol medium, route verdict "matched").
- Worklog carries the Design checkpoint (public surface, vocabulary, ports, constants, commit
  slices) — protocol rule 3 satisfied. Drift log: none, consistent with what I observed.

## Scope, provenance, regeneration honesty

- `git diff --name-only 3e5cbabf...HEAD`: 13 files — 1 prose file, 4 derived assets, 8 run
  artifacts. No hand-written `packages/`/`plugins/` source. `deno.lock` untouched; blob
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2` identical at base and head (matches the PR claim).
- `provenance.json` `sourceCommit: 99ba2bf3f` = the S1 prose commit immediately preceding the
  asset commit. `d5ba40eb` contains only the four assets. The corpus contains the new prose
  (verified by decompressing and locating the entry; see A1 for its exact stored shape).

## Gate results (all run by this evaluator at `d5ba40eb`; real exit codes)

| Command | Exit |
| --- | ---: |
| `deno task --cwd docs/site check:source-format` | 0 |
| `deno task --cwd docs/site check:links` | 0 |
| `deno task --cwd docs/site check:caveats` | 0 |
| `deno task docs:links` | 0 |
| `deno task docs:accuracy` | 0 |
| `deno task docs:snippets` | 0 |
| `deno task docs:exports-drift` | 0 |
| `deno task check:agent-docs-prose` (includes full docs/site build) | 0 |
| `deno task check:assets-barrel` | 0 |
| `deno task check:publish-assets` | 0 |
| `deno task check:mcp-export-corpus` | 0 |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 |
| `git grep -c "background reference" -- docs/site` | 0 (count 1) |
| `deno task docs:readme:check` | 1 — baseline red, not chargeable (A3) |
| `diagrams:check` | N/A from diff (A4) |

Gate set derived from the generators (`gen:agent-docs-prose`, `gen:assets-barrel`,
`gen:publish-assets`, `gen:mcp-export-corpus` in root `deno.json`; docs/site tasks in
`docs/site/deno.json`), not from any brief's list. Working tree remained clean after every check.

## Issue #1770 acceptance boxes — earned status (nothing ticked; mirror does that at ready-merge)

1. `git grep -c "background reference" -- docs/site > 0` — **earned** (count 1, exit 0 at
   `d5ba40eb`). Will need re-confirmation at the fixed head (trivially preserved if the phrase
   stays).
2. Both service- and plugin-reference messages covered — **earned** (character-exact, distinct,
   verified against the generator).
3. Preflight timing + two distinct causes stated — **substantively earned**; the surrounding
   "every declared / required configuration" framing needs the B1 qualifier before this box is
   clean.
4. Quoted text matches `generate-register-background.ts`, no invented variant — **earned**
   (programmatic character-level comparison in this evaluation; do not rest it on the
   self-dispatched evals cited in the current evidence entry).
5. Derived chain green at the pushed head, verified independently of the implementer — **earned
   at `d5ba40eb` by this formal evaluation's own runs** (`check:agent-docs-prose`,
   `check:assets-barrel`, `check:publish-assets` all exit 0); must be re-earned at the new head
   after the B1 fix regenerates the assets.

## Required PR-body edits

1. After the B1 prose fix + derived-asset regeneration (keep the two-commit discipline:
   prose fix, then derived-only commit with fresh `sourceCommit`): update the commit-slice table
   and every SHA in the body and `acceptance-evidence` block to the new head.
2. Replace the "IMPL-EVAL: PASS — session `f9b16325-…`" claim with the formal IMPL-EVAL record
   (this session's `FAIL_FIX` and the subsequent re-eval verdict); if the earlier pass is kept in
   the narrative, label it an implementation-lane internal check, not the formal IMPL-EVAL.
3. Re-point acceptance-evidence entries 4 and 5 at formal-evaluator evidence at the new head.
4. Add a truthful `## Definition of Done` checklist per the netscript-pr template (A5); a
   `## Scope` section housing the `Closes #1770` line would restore template conformance.
5. Answer the open `augmentcode[bot]` review thread (a reply — including a reasoned scope note —
   satisfies the thread gate; resolution not required).
