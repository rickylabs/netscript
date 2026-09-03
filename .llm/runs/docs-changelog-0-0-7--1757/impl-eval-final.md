# IMPL-EVAL (final, exact-head) — PR #1761

## Verdict

**PASS** at head `c1700128e38dd923cd57298c171b5976ec690a83`, with three non-blocking advisories.

This verdict supersedes `impl-eval.md` (a `PASS` at `15c262e4`, itself superseded) and replaces the
deliberately stopped renewed pass aimed at `cac095e1`. Nothing from either was inherited; every
finding below was re-derived from source at this head.

## Evaluated head and identity

| Field | Value |
| --- | --- |
| Evaluated head | `c1700128e38dd923cd57298c171b5976ec690a83` — confirmed identical via local `git rev-parse HEAD`, `git ls-remote origin docs/changelog-0-0-7`, and `gh pr view 1761 --json headRefOid` |
| Commit chain | `15c262e4` (S1 changelog) → `3befc1e2` (S2 wording repair) → `cac095e1` (S3 triage currency) → `c1700128` (S4 run-evidence correction) |
| Merge base | `13878a80`; `origin/main` at `a5520e70` (three-dot diffs used throughout) |
| Evaluator | Claude Code session, separate from the Codex generator thread `01a0522a-…` |
| Observed model | `claude-fable-5` (Fable 5), self-reported by the runtime |
| Effort | Requested route was `medium` (`formal_impl_evaluation`); the effective reasoning-effort setting is not introspectable from inside the session, so it is reported as requested-medium / observed-not-verifiable rather than asserted |
| Mode | Read-only. No tracked file edited, nothing committed or pushed, no PR/issue/label mutation. This file is the single untracked deliverable. |

## The repaired B1 sentence — explicit finding

Current wording: *"the bundle declares environment and network permissions, but environment access
is optional and network access is used only when resolving a `quality-allow` issue"*.

**Every clause is true, verified from source at this head:**

1. **"the bundle declares"** — in the shipped `packages/cli/src/kernel/assets/agent-tools.generated.ts`,
   the `quality/scan-code-quality.ts` entry's `permissions` moved from `["read"]` at tag `v0.0.6` to
   `["read", "env", "net"]` at merge base `13878a80` (confirmed by reading both blobs). A declaration
   change, exactly as stated.
2. **"environment access is optional"** — `optionalGitHubToken()`
   (`.llm/tools/quality/scan-code-quality.ts:768-776`) wraps `Deno.env.get` in try/catch and returns
   `undefined` on a permission denial; the comment and the resolver docstring both state tokenless
   runs use the anonymous API. No other env read exists on the scan path.
3. **"network access is used only when resolving a `quality-allow` issue"** — the only network call
   is `resolver.resolve()` inside `createGitHubAllowanceIssueResolver`; it is invoked (around
   `scan-code-quality.ts:968-978`) only over `new Set(allowances.map(a => a.issue))`. With zero
   `quality-allow` allowances the set is empty and no request is made. Constructing the resolver
   performs no I/O.

Neither overstatement nor understatement found. The sentence also correctly does not claim the
scanner *works* without net when allowances exist — in that case it fails closed with guidance
("Grant `--allow-net=api.github.com`; a token is optional"), which is consistent with "used only
when resolving".

## Declared-vs-required sweep — all eleven bullets

The reusable question: does any bullet describe a declared/configured/default fact as a required or
unconditional runtime one? **No. Every "requires/fails/rejects/accepts/only" claim was traced to
source; each either names a genuine runtime behavior or, where type-level, states a consequence the
consumer actually observes.**

| Bullet | Risky claim | Finding |
| --- | --- | --- |
| B1 | repaired parenthetical | True in every clause (above). |
| B1 | "surfaces silent check failures" | Correctly **not** strengthened to "fails": `f7ad44dc` makes `run-deno-check.ts` report batches that fail without parseable diagnostics, and the non-zero exit is gated on `sourceMode === 'selection'` — "surfaces" is the calibrated verb, matching PLAN-EVAL cycle 2. |
| B1 | "fails closed when Deno processes fewer files than selected" | Genuine runtime failure: `run-deno-lint.ts:717` — `exitCode = coverage.refusals.length > 0 ? 2 : …`, with `processed-count-inconsistent`/`unavailable` refusal causes. |
| B1 | "writes atomic reports" | Temp-file + rename pattern present in both wrappers (`run-deno-check.ts:417`, `run-deno-lint.ts:739`). |
| B2 | "accept `--skip-apphost`" | Declared-and-honored flag in the generated `workspace/quality-runner.ts` template (`:52`, usage `:97`) covering check/lint/fmt-check. "Accept" is a capability claim and is accurate. |
| B3 | "requires an explicit `--stream-url`" | **Re-derived, not inherited from the stopped pass:** genuine runtime `throw new Error(…)` when `options.streamUrl` is absent (`auth-plugin-command.ts:115-121`), and the option help text explains discovery via `aspire describe streams --format Json`. "Requires" is a true runtime requirement here. |
| B4 | "project missing rows as defined 404 responses" | `da574111` wires `NOT_FOUND`/404 defined behavior for GET/PATCH/DELETE in generated scaffolds, projected through `baseContract`. Behavioral. |
| B5 | "complete component manifest and collection membership" | `6917c656` projects all 66 manifest items and eight collection memberships into the generated registry. Behavioral. |
| B6 | "fails before processor startup" | Generated preflight in `generate-register-background.ts` emits `throw new Error(…)` per unresolvable declared service/plugin HTTP reference **before** processor registration. Real generated-runtime failure, unconditional for declared references. |
| B7 | "deprecates … without changing its legacy runtime behavior" | `@deprecated` JSDoc on `verify_identity` (`prisma-adapter-mysql/src/types.ts:25-36`) states both legacy branches and "Runtime behavior is unchanged for compatibility"; the commit's design (D12) forbids translator changes and pins both branches with characterization tests. Root exports `DenoMySqlClient`/`DenoMySqlConnection`/`ExecuteResult` verified removed. |
| B8 | "expose synchronous per-server status and ready clients" | `pool.snapshot` is a synchronous, I/O-free getter returning `statuses` and `readyClients` (verified in `baf1cdf6` evidence and API). |
| B9 | "without forwarding it to providers" | `RequestContext` threads via `chat({ context, metadata })`; `metadata` is the TanStack channel documented as never forwarded onto the provider wire request. Cancellation-to-tool-dispatch is part of the same change. |
| B10 | five cache/telemetry claims | Backed by `3e8e146a` (cache-provider/query/telemetry + tests) and `0ef48c2e` (stale-policy fast path + tests). Behavioral, no requires/declared conflation. |
| B11 | "rejects" / "no longer accepts" / "default `TError` changes" | All are **type-level breaks stated as the commit's own `BREAKING CHANGE` footers state them**, and each implied consumer consequence is real: `safe()` now takes `Promise<TOutput>` (`errors.ts:186-188`), so thenable-passing code stops compiling; `SafeFailure` has literal defined/non-defined arms and `undefined` payloads (runtime `createSafeFailure` matches); `baseContract` is now typed to the exact six-literal error map, so out-of-map codes are excluded from the declared error space and from the defined-error channel. Unlike the original B1 "needs" (whose implied consequence was false), these claims' implied consequences hold. Not the defect class. |

## S4 evidence correction — verified

- `c1700128` touches only `context-pack.md`, `drift.md`, `worklog.md`; `packages/cli/CHANGELOG.md`
  is byte-identical between `3befc1e2` and `c1700128` (empty diff, confirmed).
- Both corrected artifacts now say *declared*, with the optional-env / conditional-net facts stated,
  and both are accurate against the source verified above.
- Residual "requirement" phrasings exist only in explicitly historical artifacts (`plan.md`,
  `plan-eval*.md`, the `drift.md` defect quotation) that the worklog's Historical-reference audit
  designates as point-in-time evidence — plus one Progress Log narrative row (advisory A1 below).
  No live currency statement asserts the false version.

## Triage currency — verified

- `git rev-list --count v0.0.6..a5520e70` = **37**; the ordered rev-list matches the worklog's
  33-row historical table plus the 4-row reconciliation table exactly — no extra, no missing row.
- The four post-pin Exclude reasons are each true against the actual diffs:
  - `625447f1` — zero `packages/`, `plugins/`, or `docs/site` files (arch-debt ledger + `.llm/runs`
    receipts only).
  - `f8b4f804` — `docs/site` prose + regenerated carriers only.
  - `952cc106` — README/`docs/site` terminology + regenerated carriers; the `.mmd` edit is a single
    `%%` comment line (verified), so "comment-only diagram edit" is accurate.
  - `a5520e70` — one `quickstart.vto` change + regenerated carriers.
- Live totals 17 Include / 20 Exclude reconcile.

## Provisional framing and release boundary — verified

- Issue #1757 requires the provisional status **in the PR body**, not the changelog; the PR body
  states it prominently ("a top-up is mandatory before the release cut"), and the changelog section
  makes no completeness claim. Honest.
- No release introduction or notes file exists; `packages/cli/deno.json` version is `0.0.6`;
  `deno.lock` diff against `origin/main` is empty; the three-dot diff contains only the changelog
  section and run artifacts.

## Gate set — derived and independently run

Derivation: the changelog is proven to be outside every generator input — `PUBLISH_ASSET_OUTPUTS`
(`generate-publish-assets.ts:33-54`) is a closed list without it, `buildAgentDocsProseFromSite`
rebuilds only from the rendered site, and `grep -rl CHANGELOG .llm/tools/` returns nothing. Root
`fmt:check`/`lint` select `packages`/`plugins` `ts,tsx` only (`deno.json:139-161`), so they are
correctly N/A for a Markdown-only product diff. The required set is therefore the docs Tier-A gates
plus derived-asset freshness plus the lock/version boundaries — matching what the run claims.

Real exits observed by this evaluator at `c1700128` (clean tree before and after):

| Gate | Exit |
| --- | ---: |
| `deno task docs:links` | 0 |
| `deno task docs:snippets` | 0 (`scanned=581 … ts_like=298 … checked=22 exempt=14 malformed=0`) |
| `deno task docs:readme:check` | 1 — sole finding `packages/bench/README.md` missing `## Install` |
| `deno task check:publish-assets` | 0 |
| `deno task check:assets-barrel` | 0 (no tracked diff after regen) |
| `deno task check:agent-docs-prose` | 0 (`fresh: true`, `stalePaths: []`) |
| `deno task docs:accuracy` | 0 |
| `deno task docs:exports-drift` | 0 |
| `git diff --exit-code -- deno.lock` | 0 |
| `git diff --exit-code -- packages/cli/deno.json` | 0 (version `0.0.6`) |

**Baseline red agreement:** yes — the `docs:readme:check` exit 1 is not chargeable. The PR's
three-dot diff touches only `packages/cli/CHANGELOG.md` and `.llm/runs/**`; `packages/bench/` is
untouched, so the finding cannot originate here, independent of the run's clean-archive
reproduction.

## PR body truthfulness — verified

- Slice boxes S1–S4 with SHAs `15c262e4`/`3befc1e2`/`cac095e1`/`c1700128` match the actual chain.
- The live range (37 through `a5520e70`), the four-move baseline narrative, and the post-pin Exclude
  table all match reality.
- Every validation-table exit matches my independent runs, including the snippet counts
  (581/298/0) and both baseline-red rows.
- All six DoD boxes are true: eleven bullets in convention; 37 rows with reasons; consumer-only
  content (no hashes, PR numbers, harness/CI churn in the changelog); provisional/pin framing
  explicit; boundaries preserved; generator inputs proven from source with real exits.
- The IMPL-EVAL-history section honestly marks the `15c262e4` PASS superseded and withholds
  readiness pending this evaluation. The acceptance-evidence block is re-pinned to `c1700128`
  (box 1 names this head) and each of its five evidence claims is true at this head.
- No false checked box found; the close-gate is not violated.

## Issue #1757 boxes — still hold at `c1700128`

All five Acceptance boxes, ticked by the mirror at the superseded head, remain true at this head:
the 0.0.7 section exists (box 1); every bullet traces to a merged change in the live range (box 2);
no internal churn is described (box 3); provisional status is stated in the PR body (box 4); the
release-intro boundary is respected (box 5). The later commits changed wording accuracy and
evidence, not the substance any box rests on; the mirror's planned re-application from the PR body
block at `status:ready-merge` will re-validate against a body that is already accurate.

## Blocking findings

None.

## Advisories (non-blocking)

- **A1 — one uncorrected historical narration in a live artifact.** `worklog.md` Progress Log's
  PLAN-EVAL cycle 2 row still narrates the finding as "B1 omitted the scanner's new permission
  requirement" without a historical marker. It records what cycle 2 said at the time, and later rows
  carry the correction, but a one-word gloss (e.g. "permission *declaration* (then miscast as a
  requirement)") would make the log self-consistent on first read.
- **A2 — shipped-bundle usage example is narrower than its declaration.** At merge base (and this
  head), the generated agent-tools README example runs the scanner with `--allow-read` only while
  the manifest declares `read,env,net`. That is coherent with the optional/conditional facts (and
  the fail-closed error tells the user what to grant), but the framework docs lane may want the
  example to mention the allowance-resolution case. Framework-source concern; out of this PR's
  scope.
- **A3 — B11's "rejects"/"accepts" are type-level.** Accurate as written (they mirror the source
  commit's BREAKING CHANGE footers and their consumer consequences are real), but a future changelog
  pass could prefix such clauses with "the types now…" to keep the declared/runtime line visible.

## Required PR-body edits

None. The body is accurate at this head.
