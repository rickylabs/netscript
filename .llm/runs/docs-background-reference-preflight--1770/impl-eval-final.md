# IMPL-EVAL (final) — docs-background-reference-preflight--1770 (PR #1772)

## Verdict

`PASS`

Both blocking findings from the cycle-1 `FAIL_FIX` at `d5ba40eb` are genuinely discharged at this
head, the repair introduced no new defect into the published content, both quoted error templates
are unchanged and character-exact against the shipped generator, and all 13 derived-chain gates
plus the generator's own test suite exit 0 at this exact head. One narrative sentence in the PR
body is stale (a superseded `sourceCommit` value) and must be corrected in the same body edit that
records this verdict — a body-only fix, not a content or code defect, and no checked DoD box is
false.

## Evaluated head

- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1770`, branch
  `docs/background-reference-preflight`.
- Local HEAD `0e9fc593cb748d6b5fca781493bc0342cf098d7f` = PR #1772 remote `headRefOid` (verified
  via `gh pr view 1772`). Base `origin/main` `3e5cbabf`. Tree clean before and after evaluation
  (`git status --porcelain` empty, including after all gate runs).
- Commit chain verified: `99ba2bf3` (prose) → `d5ba40eb` (assets) → `e4f47289` (B1 prose repair +
  run history) → `14d5aefd` (assets only) → `0e9fc593` (harness record). Matches the brief's
  Addendum.

## Evaluator identity

- Requested route: Claude · Anthropic · Fable 5 · medium (`formal_impl_evaluation`, native
  opposite-family for Codex-authored work).
- Observed: model-confirmed `claude-fable-5`; effort as-requested (medium) — effort is not
  introspectable from inside a session, so this is stated as model-confirmed / effort-as-requested,
  not asserted as a route match.
- Generator ≠ evaluator holds: generator was Codex · OpenAI · `gpt-5.6-sol` · medium, thread
  `01a052ea-0462-7e83-b427-d53f034ef913`; this is a separate Claude session, and it is also not
  the cycle-1 evaluator session.

## B1 discharge — is the new qualifier faithful?

**Yes.** The emitted guard is
`if (config.BackgroundProcessors['<name>']?.Enabled !== false) {`
(`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`,
"Skip disabled entries"). Truth table against the page's "not explicitly disabled":

| Runtime config state | `?.Enabled !== false` | Preflights? | "not explicitly disabled"? |
| --- | --- | --- | --- |
| `Enabled: false` | false | no | correctly excluded |
| `Enabled: true` | true | yes | correctly included |
| entry present, `Enabled` absent/`undefined` | true (`undefined !== false`) | yes | correctly included |
| **no config entry at all** (optional chain) | true (`undefined !== false`) | yes | correctly included |

An unconfigured processor still preflights, and only a literal `Enabled: false` skips — the wording
neither over- nor under-promises. "Each **such** declaration is required configuration" correctly
binds the required-configuration claim to the non-disabled scope; the source comment ("A declared
reference is required configuration, so missing resources and resources without an HTTP endpoint
are equally fatal") sits inside that same guarded block, so the page no longer outruns the code.

## B1 discharge — narrowed everywhere?

Checked all four surfaces at HEAD, plus a repo sweep for surviving unqualified variants:

- **Public page** `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:175-177` — carries
  "For each background processor that is not explicitly disabled … Each such declaration…".
- **`research.md`** — findings 1 and 2 both open with the qualifier and finding 1 explicitly states
  the `Enabled: false` skip.
- **`plan.md`** — Scope bullet, D3, and the risk-register entry all carry the qualifier (D6 records
  the repair discipline).
- **PR body** — the Harness-evaluation repair bullet states the narrowed claim verbatim.
- **Corpus** — `prose.json.gz` decompressed: the qualified sentence appears (2 stored occurrences,
  page + llms-full), no unqualified residue.
- Sweep: every remaining "every declared" hit in this run's artifacts is either qualified in the
  same sentence or a historical description of the defect (`drift.md`, `evaluate.md`, cycle-1
  `impl-eval.md`). No artifact still asserts the false version — the #1761 failure mode is absent.

## Template drift check

`git diff d5ba40eb..HEAD -- docs/site` touches only the qualifying prose in the list item's opening
sentences; both quoted `<code>` templates are byte-identical to the cycle-1-verified text. Compared
again directly against the generator source at HEAD:

- `Background processor configuration error: '${name}' could not resolve service reference '${ref}' HTTP endpoint.`
- `Background processor configuration error: '${name}' could not resolve plugin reference '${ref}' HTTP endpoint.`

Page quotes match exactly with `<processor>`/`<ref>` substituted for `${name}`/`${ref}`, the two
variants are kept distinct, and the page states the placeholders are substituted rather than
literal. **No drift.**

## The four claims (re-verified at this head, not inherited)

1. **Timing — verified.** The preflight block is emitted before `builder.addExecutable(...)` for the
   same processor;
   `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts`
   asserts at runtime ("addExecutable must not run before reference preflight", `assertRejects`
   with registrations still empty). Test file re-run at this head: exit 0.
2. **Required configuration by design — verified,** now correctly scoped. Source comment verbatim;
   throw unconditional inside the guarded block.
3. **Two causes collapse — verified.** `await _services.get('${ref}')?.getEndpoint('http')` (resp.
   `_plugins`): missing map entry short-circuits to `undefined`; a present resource whose
   `getEndpoint('http')` resolves `undefined` (the typed contract is
   `Promise<string | undefined>`, per the test's `EndpointResource` interface) hits the same
   `if (!endpoint) throw`. The test exercises both paths (`endpointResource(undefined)` and absent
   entry) per kind, producing the identical message.
4. **Not a processor failing under load — verified.** The throw precedes `addExecutable`; the
   executable is never registered or spawned. Startup configuration error is the honest framing.

## Modal-verb sweep (repaired sentence)

- "that is **not explicitly disabled**" — matches `Enabled !== false` exactly (table above).
- "preflights **every** declared service and plugin reference" — inside the guarded block, all
  `ServiceReferences` and `PluginReferences` entries are preflighted; now true as scoped.
- "**before registration**" — true (claim 1).
- "Each **such** declaration **is required** configuration" — enforcement scope and claim scope now
  coincide.
- "**fails fast**" — the throw rejects the AppHost build; `aspire start` aborts.
- "when the resource **is missing or** … has no `http` endpoint" — both causes collapse (claim 3);
  endpoint name literally `http`.
- "**not** a processor failing under load" — true (claim 4).
- "The generated code **substitutes** …" — unchanged from cycle 1; still the benign A2 looseness
  (substitution happens at generation time), tightening-only.

## B2 discharge — evaluation honesty

**Discharged.** The PR body no longer presents the self-dispatched pass as the formal IMPL-EVAL: it
is explicitly retracted, the cycle-1 `FAIL_FIX` is recorded with both findings, `plan-eval.md` is
labelled self-dispatched, and the final DoD box is deliberately unticked pending this verdict.
`evaluate.md` records cycle 2 as `PENDING` and states it "does not predict or self-certify that
verdict" — honest. The `augmentcode[bot]` thread that independently raised B1 now carries a
substantive reply from `rickylabs` (thread answered; now outdated after the repair) — the
review-thread gate is satisfied.

Process observation (unchanged from cycle 1, for the record): `plan-eval.md` was produced by the
implementation thread. I did not inherit its verdict; its load-bearing reasoning (placement,
quoting, timing, causes, two-commit provenance) re-derives cleanly against source and tests.

## Regeneration honesty

- `provenance.json` `sourceCommit: "e4f47289b"` = the prose-repair commit immediately preceding the
  asset commit `14d5aefd`. Correct.
- `git show --stat 14d5aefd`: exactly the four carriers (`prose.json.gz`, `provenance.json`,
  `agent-docs.generated.ts`, `publish-assets.generated.ts`). Nothing else.
- Corpus decompressed and searched: qualified sentence present; both template quotes present (with
  the pre-existing A1 line-wrap inside the stored code span — unchanged behaviour, not chargeable).
- `deno.lock`: `git diff origin/main...HEAD -- deno.lock` empty.
- Scope: `git diff --name-only 3e5cbabf...HEAD` = 1 prose file, 4 derived assets, 10 run artifacts;
  no hand-written `packages/`/`plugins/` source.

## Gate results (all run by this evaluator at `0e9fc593`; real exit codes)

Gate set derived from the generator pairs in root `deno.json` (`gen:`/`check:` for agent-docs-prose,
assets-barrel, publish-assets, mcp-export-corpus) plus the `docs/site/deno.json` suite — not from
any brief's or the PR's list.

| Command | Exit |
| --- | ---: |
| `deno task --cwd docs/site check:source-format` | 0 |
| `deno task --cwd docs/site build` | 0 |
| `deno task --cwd docs/site check:links` | 0 |
| `deno task --cwd docs/site check:caveats` | 0 |
| `deno task docs:links` | 0 |
| `deno task docs:accuracy` | 0 |
| `deno task docs:snippets` | 0 |
| `deno task docs:exports-drift` | 0 |
| `deno task check:agent-docs-prose` | 0 |
| `deno task check:assets-barrel` | 0 |
| `deno task check:publish-assets` | 0 |
| `deno task check:mcp-export-corpus` | 0 |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 |
| `git grep -c "background reference" -- docs/site` | 0 (count 1) |
| `deno test --allow-all …/generate-register-background_test.ts` | 0 |
| `deno task docs:readme:check` | 1 — baseline red, confirmed below |
| `diagrams:check` | N/A — diff contains no `.mmd`/`.svg` |

`docs:readme:check` fails solely on `packages/bench/README.md` missing `## Install`; that file is
not in this diff, so I agree it is pre-existing baseline red and not chargeable. Working tree clean
after every gate. This independently reproduces the supervisor Tier-A claim of 13 green gates
rather than inheriting it.

## Blocking findings

None.

## Advisories (non-blocking)

- **A1 (required PR-body edit) — stale `sourceCommit` sentence.** The `## Commit slices` section
  still says "`provenance.json` records `sourceCommit: 99ba2bf3f`, the immediately preceding S1
  prose commit." At this head it records `e4f47289b`. The DoD box on provenance is phrased
  invariantly and is true, and the repair bullet gives the correct chain, but the present-tense
  sentence is now false. Fold the fix into the same body edit that records this verdict: extend the
  slice table with S3 `e4f47289` / S4 `14d5aefd` / `0e9fc593` and point the sentence at
  `e4f47289b`.
- **A2 (carried from cycle 1) — corpus line-wrap inside the stored code span** splits an exact
  one-line substring search of the full message over the raw corpus; head and tail survive and the
  rendered HTML collapses to the exact message. Pre-existing extractor behaviour, unchanged by the
  repair, not chargeable.
- **A3 — "explicitly disabled" does not name the switch.** The page relies on the reader knowing
  the disable mechanism is `Enabled: false`. Proportionate for a footgun list (research.md and the
  guard itself name it); naming the key inline would remove the last ambiguity if this page is ever
  touched again. No action required now.

## Issue #1770 acceptance boxes — earned status (nothing ticked; mirror ticks at ready-merge)

1. `git grep -c "background reference" -- docs/site` > 0 — **earned** (count 1, exit 0, at
   `0e9fc593`).
2. Both service- and plugin-reference messages covered — **earned** (distinct, character-exact,
   re-verified at this head).
3. Preflight timing and the two distinct causes stated — **earned**; the B1 qualifier that kept
   this box dirty in cycle 1 is now in place on every surface.
4. Quoted text matches `generate-register-background.ts` on `main`, no invented variant —
   **earned** (this evaluation's own comparison at HEAD; templates unchanged since the cycle-1
   character-exact verification).
5. Derived chain regenerated, `check:agent-docs-prose`/`check:assets-barrel`/`check:publish-assets`
   green at the pushed head, verified independently of the implementer — **earned** (this formal
   evaluation's own runs at `0e9fc593`, all exit 0).

## Required PR-body edits (with the verdict-recording update)

1. Record this formal IMPL-EVAL: `PASS` at `0e9fc593` (report `impl-eval-final.md`), and tick the
   final DoD box — that is the supervisor's edit, not mine.
2. Fix the stale `sourceCommit: 99ba2bf3f` sentence and extend the commit-slice table (advisory A1).

No docs-content, asset, or code changes are required.
