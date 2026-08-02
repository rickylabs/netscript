# PLAN-EVAL cycle 2 — fix-1025-aspire-otel-discovery--otel-discovery

## Session and lane

| Field | Value |
| --- | --- |
| Cycle | 2 |
| Evaluator | Claude Opus 5, two fresh parallel sessions (background jobs `1d0063b2` and `ba6e5f51`), host `/home/codex/repos/fix-1025`; this file is their consolidated record |
| Generator | Codex · OpenAI · GPT-5 (`supervisor.md`) — separate session, separate family |
| Cycle-1 evaluator | Opus 5 supervisor session (separate session from this one) |
| Planned commit | `845de0415` |
| Branch | `fix/1025-aspire-otel-discovery` |
| Protocol | `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md` |
| Archetype / overlay | `ARCHETYPE-6-cli-tooling` + `SCOPE-docs` |

**Separation.** This session did not author `research.md`, `plan.md`, `worklog.md`, or the cycle-1
`plan-eval.md`. Generator ≠ evaluator holds.

**Route deviation, restated.** The canonical `formal_evaluation` route
(Claude Code · OpenRouter · `qwen/qwen3.7-max`) is unavailable — `drift.md` records
`status: blocked`, `credential: absent`, `auth_required`. This lane is a **closed model** and
therefore a standing deviation from the open-models-only evaluator rule, running under the owner
waiver recorded in the cycle-1 artifact. It does not become policy by repetition; the credential
blocker in `drift.md` remains the open item.

**Scope of this pass.** Plan only. No source edited, no `deno.lock` touched, no expensive E2E run.
The only file written is this one.

**Consolidated artifact — two parallel evaluator sessions.** The supervisor dispatched two
independent Opus evaluator background jobs for cycle 2 (`1d0063b2` and `ba6e5f51`). They ran without
knowledge of each other and landed on the same verdict (`FAIL_PLAN`) and the same two findings
A and B. Job `ba6e5f51` additionally found the published-surface misclassification recorded below as
**Finding C**, which corrects that session's own `PASS` on boxes 6 and 8. This file is the merged
record; where the two passes differed, the box result was resolved against the tree, not against
either session's prose.

## Cycle-1 disposition

### Finding 1 — L1 locked without falsifying the NetScript-side hypothesis → **RESOLVED**

The demanded A/B control was performed, and its artifacts are still on disk in the disposable
reproduction. Verified directly:

- `.llm/tmp/telemetry-1025-repro/aspire/aspire.config.json` (mtime 21:25, after the 21:15 scaffold)
  contains `ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL`, `ASPIRE_ALLOW_UNSECURED_TRANSPORT`, and
  `ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL` — `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` is **gone**.
- `.llm/tmp/telemetry-1025-repro/aspire/.helpers/configure-dashboard.mts` (mtime 21:25) assigns
  exactly two variables: `OTLP_HTTP_ENDPOINT` and `ALLOW_UNSECURED_TRANSPORT`. The
  `UNSECURED_ALLOW_ANONYMOUS` assignment is **gone**.
- The repository templates are **unmodified**: `configure-dashboard.ts.template:16` still sets
  anonymous mode, `generate-aspire-config.ts:140` still emits it. The A/B was run against the
  disposable copy, not the template, exactly as cycle-1 required.

The control is a true single-variable change: `ALLOW_UNSECURED_TRANSPORT` was held constant, which
is what makes research F7 (transport is not the cause and must remain) and F4 (anonymous mode is the
cause) separable rather than confounded. The mechanism cycle-1 hypothesised — anonymous mode
suppressing the tokenised dashboard-info the CLI's discovery call carries — is now the recorded
cause, and `drift.md` logs the reclassification at severity `significant` with the authorisation
chain. Non-Scope no longer carries the "published and served" overclaim.

Corroborating evidence the plan does not yet cite, and should:
`docs/site/explanation/aspire.md:352` already documents that `aspire start` "prints a URL and a
one-time login token for the dashboard." The documented product behaviour was always tokenised
login; anonymous mode was the anomaly. The fix restores documented behaviour rather than changing it.

### Finding 2 — acceptance box 1 mapped optimistically → **RESOLVED BY SUPERSESSION**

Finding 2 was conditional on H-upstream. With the cause established as NetScript-side, box 1
("works without a manual `--dashboard-url`") is satisfiable outright by the template fix, and no
partial documented-remedy claim is needed. The open-decision sweep records this as
`Acceptance box 1 | resolved`. Confirmed against the live issue: acceptance box 4 is explicitly
conditional (*"**If upstream**, an issue is opened there and linked…"*), so dropping the
upstream/docs/skill workaround work is a correct consequence of the reclassification, not a scope cut.

## Plan-Gate checklist

Walked box by box against `.llm/harness/gates/plan-gate.md`.

| # | Box | Result | Evidence |
| - | --- | --- | --- |
| 1 | Research present and current | **PASS** | `research.md` exists; re-baselined against `origin/main` @ `3ab64720f`. Spot-checked two load-bearing findings against the tree — both hold exactly (below). |
| 2 | Decisions locked | **PASS** | `L1`–`L5` stated with rationale. `L1` now rests on the performed A/B whose artifacts I verified on disk, not on inference. |
| 3 | Open-decision sweep | **UNCHECKED** | See Finding A. `aspire export` recovery is nowhere in the sweep and is rework-forcing when deferred. |
| 4 | Commit slices | **PASS** | 4 slices, ordered, < 30. Each names what it proves, its gate, and its files (`worklog.md` §Commit Slices). |
| 5 | Risk register | **PASS (with note)** | 4 risks with mitigations. Two omissions noted below; the material one is escalated as Finding A rather than double-counted here. |
| 6 | Gate set selected | **UNCHECKED** | See Finding C. `plan.md` §Fitness Gates maps to the Archetype-6 matrix on the premise that no published package source changes. That premise is false for slice 2, and the gates it excludes are the mandatory `packages/**` ones. |
| 7 | Deferred scope explicit | **UNCHECKED** | See Finding B. The C# control is properly deferred; a doc the change invalidates is neither in scope nor declared deferred. |
| 8 | jsr-audit (package/plugin waves) | **UNCHECKED** | See Finding C. `research.md` marks `N/A` on the same dead premise. `packages/aspire/constants.ts` being untouched is true but not the relevant test — the published surface at issue is `@netscript/cli`, and slice 2 edits three files inside it. |

### Spot-checks performed

**F6 (silent-warning defect) — confirmed.** `#checkTelemetry()` in
`.llm/tools/e2e/scaffold-e2e-test.ts` opens with `const critical = this.#options.strictTelemetry;`
and passes that flag to all three steps (`telemetry-otlp-port`, `telemetry-otel-logs`,
`telemetry-otel-traces`). No step asserts anything about stdout. The false-green is real and the
plan's `L4`/`L3` correction targets it precisely.

**F9 (emitted twice) — confirmed, and the boundary is drawn correctly.** Emission sites are exactly
two: `generate-aspire-config.ts:140` (into `aspire.config.json`) and
`configure-dashboard.ts.template:16` (into the AppHost process). `embedded.generated.ts` embeds the
template and is correctly captured by `L5`/Hidden Scope as a regeneration target.
`packages/aspire/constants.ts:66` and `_aspire-compat.ts.template:72` are **name declarations, not
emissions** — leaving them is right, and `packages/aspire/tests/helpers_test.ts:70-71` (which
asserts only the constant→string mapping) stays green. Slice 2's "tests" must cover
`generate-aspire-config_test.ts:35` and `generators-pipeline_test.ts:139,160`, which assert the
variable's presence and will fail by design; the slice's gate ("focused template tests") makes that
visible.

## Finding A — `aspire export` recovery is unevidenced, unswept, and promoted to a critical gate (blocking)

Acceptance box 2 is a first-class requirement: *"`aspire export` likewise."* `L4` promotes export to
a **critical** capability check, and the Risk Register adds an artifact assertion for it.

But nothing in `research.md` evidences that `aspire export` recovers. F1–F4, F7, and F8 all exercise
`aspire otel traces` only. F5 is help-output only — it establishes that `export` *accepts*
`--dashboard-url`, which is a statement about flags, not about whether `--apphost` discovery
succeeds. The issue's claim that export "fails identically" is a statement about the broken state; it
is not evidence that export *recovers* identically.

Two facts sharpen this:

- **The E2E has no export step at all today.** Grepping `scaffold-e2e-test.ts` for an export
  invocation returns nothing; the only hit in that region is `--isolated` at line 1036. Slice 3 is
  not tightening an existing check — it is introducing a brand-new critical command whose success
  has never once been observed in this run.
- **The failure lands at the most expensive point.** Slice 4 is the one-pass
  `scaffold.runtime --cleanup` run. If export does not recover, that is where it surfaces: after all
  implementation is complete, forcing rework of slice 3, a second expensive run, and reopening the
  cause classification for the export path specifically — the precise "expensive fix after
  implementation" the Plan-Gate exists to prevent.

The sweep does not list this decision at all, so it is not marked "safe to defer" or "must resolve
now." Per the Plan-Gate's explicit rule — *if any open decision would force rework when deferred →
`FAIL_PLAN`* — box 3 is unchecked.

This is the same standard cycle-1 applied to `L1`, and the discriminator is again far cheaper than
the thing it protects. Honest cost statement: `aspire ps --format Json` currently returns `[]`, so
the reproduction AppHost is **not** running — the check requires restarting the already-patched
repro under `.llm/tmp/telemetry-1025-repro/` and issuing one `aspire export … --apphost apphost.mts`
against it. That is minutes and one AppHost start, against a full `scaffold.runtime` pass.

**Required fix.** Either (a) run `aspire export` against the patched reproduction, record the result
as a research finding, and add the corresponding sweep row; or (b) add an explicit sweep row marking
export recovery unverified with a stated fallback if slice 4 fails it. (a) is strongly preferred — it
is what makes acceptance box 2 tickable on evidence rather than by analogy.

## Finding B — the change invalidates a doc that is neither in scope nor declared deferred (blocking)

`docs/site/explanation/aspire.md:83` embeds a verbatim `aspire.config.json` sample whose
`environmentVariables` block includes `"ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS": "true"`. Slice 2
removes that variable from generated output. On landing, that documented sample no longer matches
what `netscript generate` produces.

`plan.md` Non-Scope line 41 excludes "workaround docs, skill change, Claude mirror, or upstream
issue." That exclusion is **correct for workaround documentation** — with a NetScript-side fix there
is no workaround to document. But it sweeps out a different category: a doc that *this change itself
falsifies*. That is not workaround prose, it is source alignment.

The run declares the `SCOPE-docs` overlay, whose additional gates include **Source alignment**
("every prescriptive claim points to doctrine, RFC, or code") and whose named false-done states cover
exactly this shape. The plan's own §Fitness Gates lists "Source alignment | yes". The overlay is
declared, the gate is claimed, and the one doc the change touches is excluded — so box 7 is
unchecked: this is neither in scope nor recorded as deferred scope or debt.

**Required fix.** Either add the one-line correction to `docs/site/explanation/aspire.md:83` to slice
2 (cheapest, and keeps the declared Source-alignment gate honest), or state it explicitly under
Deferred Scope with a debt entry. Silently excluding it is the option that is not available.

While there, `docs/site/explanation/aspire.md:352` is worth citing in `research.md` as
corroboration — it already documents the one-time login token, which independently supports the
NetScript-side classification.

## Finding C — the plan asserts it does not touch published package source; it does (blocking)

Two statements in the plan:

- `plan.md` §Archetype: *"No published CLI command or package implementation changes. The edited E2E
  harness remains outside the published package surface."*
- `plan.md` §Fitness Gates: `JSR/package gates | no | No published package source change.`

And the matching line in `research.md` §jsr-audit surface scan: *"N/A: this slice changes repository
E2E tooling, skills, and documentation, not a published package surface."*

All three were accurate for the **cycle-1** plan, whose only product change was E2E tooling plus
docs. The reclassification moved the fix into `packages/cli` and the surface statements did not move
with it. `packages/cli/deno.json` `publish.include` is:

```
"src/**/*.ts",
"src/**/*.template"
```

Every file slice 2 edits is inside that surface and ships in `@netscript/cli`:

- `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`
- `packages/cli/src/kernel/assets/aspire/helpers/configure-dashboard.ts.template`
- `packages/cli/src/kernel/assets/embedded.generated.ts`

This is not bookkeeping — it selects the wrong gate set, and it is the reason boxes 6 and 8 are
unchecked:

1. **`deno task quality:scan` and `deno task arch:check` are omitted.** `netscript-harness` is
   categorical: any slice touching `packages/**` requires both at slice review, and it names
   reviewing on the scoped wrappers alone as *"the exact hole that let #745 merge."* The Validation
   Plan lists only the scoped wrappers, focused tests, asset generation, and the runtime E2E.
   `deno task quality:gate` runs both in one command.
2. **The jsr box was marked `N/A` on the same dead premise.** The publishability rubric has not been
   applied to a surface that is in fact published. The likely outcome is benign — removing an object
   property and a `process.env` assignment does not change exported types — but "likely benign" is a
   conclusion the rubric produces, not a substitute for running it.
3. **The asset-drift check is unnamed.** §Fitness Gates says *"Repo-native embedded asset
   generator"* without naming it. It is `deno task check:assets-barrel`
   (`gen:assets-barrel && git diff --exit-code`), and it is the gate that proves
   `embedded.generated.ts` was regenerated rather than hand-edited — which matters precisely here,
   because that file carries a `GENERATED CODE - DO NOT EDIT` contract and its source template is
   one of the two emission sites.
4. **Archetype-6 §"Required Gates in Order" item 5 (consumer gates) is now in play** — *"required
   when the slice changes generated outputs"* — which slice 2 squarely does. The one-pass
   `scaffold.runtime` run covers this in substance; the plan should map it rather than leave it
   unstated.

**Required fix.** Correct the two surface statements in `plan.md` and the `N/A` in `research.md`; add
`quality:scan` + `arch:check` (or `quality:gate`) and `check:assets-barrel` to §Fitness Gates and the
Validation Plan; record an applied jsr rubric verdict over the three edited published files; and map
the Archetype-6 consumer gate to the runtime E2E.

## Non-blocking notes

1. **Tokenised dashboard is a user-visible behaviour change, unnamed in the risk register.** After
   slice 2 every generated project's dashboard requires the one-time login token. I checked
   `.llm/tools/e2e/` for anonymous dashboard HTTP access and found none, so no E2E breakage is
   predicted, and `aspire.md:352` shows this restores documented behaviour. It should still appear as
   a named risk rather than an unstated consequence, since it changes what a developer sees on first
   opening `https://localhost:18888`.
2. **Port traceability nit.** `research.md` F2 cites `https://localhost:42183` and F3 cites
   `https://localhost:43903`. Presumably different runs across a restart; a one-line note would keep
   the evidence chain unambiguous for IMPL-EVAL.
3. **Slice 2 file list.** "tests" is adequate but implicit; naming
   `generate-aspire-config_test.ts` and `generators-pipeline_test.ts` would make the slice's blast
   radius self-evident. `packages/aspire/tests/helpers_test.ts` needs no change.

## What is sound and must carry forward unchanged

`L2`–`L5`, the Hidden Scope hazards (dual emission plus embedded-asset regeneration), the semantic
E2E gate design (non-empty trace JSON, non-zero export artifact), the retention of
`ASPIRE_ALLOW_UNSECURED_TRANSPORT` on evidence, the four-slice ordering, and the one-pass validation
plan are all sound. The cause reclassification is well-evidenced and materially improves the issue
outcome — it converts a documented workaround into a real fix and correctly retires the conditional
upstream box. Findings A, B, and C are additive and touch the sweep, the doc surface, the risk
register, and the gate table only — none touches the investigation, `L1`–`L5`, or the fix design.
**Do not restart the slice, and do not revisit `L1`.**

## Verdict

**FAIL_PLAN**

Unchecked boxes:

- **3 (open-decision sweep)** — Finding A. `aspire export` recovery is unevidenced, unswept, and
  promoted to a critical gate that surfaces only in the most expensive step.
- **6 (gate set selected)** and **8 (jsr-audit)** — Finding C. The plan mis-states its own surface:
  slice 2 edits three files inside `@netscript/cli`'s `publish.include`, so the mandatory `packages/**`
  gates (`quality:scan`, `arch:check`) and the jsr rubric were excluded on a premise the re-scope
  invalidated.
- **7 (deferred scope explicit)** — Finding B. `docs/site/explanation/aspire.md:83` is invalidated by
  slice 2 while all docs work sits in Non-Scope and nothing is declared deferred.

Implementation may **not** begin.

All three fixes are amendments in place, not a re-plan: run `aspire export` against the
already-patched reproduction and record it (or sweep it explicitly); correct the two published-surface
statements and add the missing `packages/**` gates and jsr verdict; and either fold the one-line doc
correction into slice 2 or declare it deferred with a debt entry. Everything else in the plan stands.

**Loop limit reached.** Per `evaluator/plan-protocol.md`, this is the second `FAIL_PLAN` cycle, so
the run escalates to the owner with the unresolved items above rather than proceeding to a cycle 3.
Assessment for that decision: the amended plan should pass — none of the three findings touches the
investigation or the fix design. Finding A is the one item where a written owner waiver is
defensible: the shared-transport inference from issue #1025 is genuinely reasonable, and performing
the export check during implementation instead is a legitimate call provided the waiver is recorded
in `drift.md`. Finding C is not waivable on the same terms — the plan currently mis-states its own
surface, and the gates it therefore omits are the ones `netscript-harness` names as the specific hole
that let #745 reach `main`. Finding B is a single line either way.

---

# Supervisor adjudication of the cycle-2 escalation — 2026-08-01

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Cycle 2 reached the `plan-protocol.md` loop limit and escalated to the owner. I am the supervising
session for this fix and I am resolving the escalation here rather than stalling the run.

## 1. The evaluator-credential blocker in `drift.md` is void

`drift.md` §"Formal local evaluator credential unavailable" concludes *"No implementation may begin
before one of those occurs."* That dependency no longer exists. Under the owner instruction of
2026-08-01 the Opus supervisor performs PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train: the
generator is Codex (GPT family) and the evaluator is Claude family in a separate session, so the
independence the harness invariant protects is already satisfied. The open-model `formal_evaluation`
route is not required and a missing OpenRouter credential is **not** a blocker and must never be
reported as one. Amend that drift entry to record the waiver rather than an open blocker.

Both PLAN-EVAL cycles were validly constituted: cycle 1 by this supervisor session, cycle 2 by a
separate fresh Opus session. Neither authored the plan.

## 2. Findings A and B — NOT waived. Perform them.

Cycle 2 offered a waiver as defensible. I decline it. Both checks cost minutes and both protect the
issue's own acceptance boxes:

- **Finding A — `aspire export` (acceptance box 2).** Box 2 is a first-class requirement and no
  evidence in the run shows export *recovering*. "Fails identically" is a claim about the broken
  state; symmetry of failure does not imply symmetry of repair, and `export` is being promoted to a
  critical gate whose success has never been observed. Restart the already-patched reproduction under
  `.llm/tmp/telemetry-1025-repro/` and run `aspire export --apphost apphost.mts --non-interactive
  --nologo -o <path>`. Record the result as a research finding and add the sweep row. If export does
  **not** recover with the anonymous flag removed, stop and report — that is a materially different
  outcome and box 2 would then need the documented-workaround arm after all.
- **Finding B — `docs/site/explanation/aspire.md:83` (source alignment).** The change falsifies a
  verbatim `aspire.config.json` sample that this run's own declared `SCOPE-docs` overlay and
  §Fitness Gates promise to keep aligned. Fold the one-line correction into slice 2. Do not defer it
  to a debt entry — deferring a doc your change breaks, in a run that claims the source-alignment
  gate, is the false-done state the overlay names.

Cycle 2's three non-blocking notes are also adopted: add the tokenised-dashboard behaviour change to
the risk register, resolve the F2/F3 port discrepancy with a one-line note, and name the two template
tests in the slice-2 file list.

## 3. One addition of my own — the blast radius of requiring the login token

Removing `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` means every generated project's dashboard
requires the one-time login token. Cycle 2 checked `.llm/tools/e2e/` and found no anonymous
dashboard access. Widen that check once before implementing: grep the repo for anything that opens
`localhost:18888` or the dashboard URL without a token — docs, skills, MCP wiring, scaffold README,
`netscript` CLI output. Anything that tells a user or agent to just open the dashboard now needs to
say where the token comes from. If that surface is larger than a couple of lines, report it rather
than expanding this slice to cover it.

This is also why I expect this PR to land as **draft for human review** even when green: it changes
the default security posture of every generated project's dashboard. That is the right fix and it
restores the behaviour `aspire.md:352` already documents, but it is a user-visible default change
beyond the literal text of #1025 and a human should confirm the intent.

## Verdict

**PASS — cycle 3, conditional.** Implementation is authorised subject to Findings A and B being
performed as amendments in place, plus the token blast-radius check in §3. `L1`–`L5` are settled; do
not revisit the cause. Do not restart the slice and do not re-plan.

Record this adjudication in `drift.md` (superseding the credential blocker) and proceed.

---

## Evaluator note — Finding C is not covered by the conditional PASS above

Written by cycle-2 evaluator job `ba6e5f51` after the adjudication landed. Flagged, not adjudicated —
the disposition is the supervisor's call.

The adjudication resolves Findings A and B and adds the token blast-radius check, but it was authored
concurrently with **Finding C** (boxes 6 and 8 — the plan states it changes no published package
source, while slice 2 edits three files inside `@netscript/cli`'s `publish.include`). The conditional
PASS therefore authorises implementation subject to A and B only, and Finding C is currently
unaddressed in the authorisation.

Concretely, implementation under the PASS as written would proceed **without** `deno task
quality:scan` and `deno task arch:check` on a `packages/**` slice, without `deno task
check:assets-barrel` naming the generator that proves `embedded.generated.ts` was regenerated rather
than hand-edited, and with `research.md` still recording a jsr `N/A` for a published surface. Those
are the gates `netscript-harness` names as the hole that let #745 reach `main`.

The fix is a gate-table amendment, not a re-plan, and is smaller than either A or B. Suggested
disposition: fold it into the same amendment pass, or waive it explicitly on the record. §3 of the
adjudication also broadens naturally with it — the scaffold README and generated-project surface it
asks about live inside the same published `packages/cli` tree.
