# Tier-A supervisor slice review — S5 repair cycle (PR #1740)

- **Reviewer:** Claude · Anthropic · Opus 5 · high — Aspire topic supervisor (NAS session
  `007-aspire-9a`). Not the implementation lane; this review does not self-certify and does not
  replace the independent IMPL-EVAL.
- **Implementation lane:** Codex · OpenAI · GPT-5.6 Sol · medium, thread
  `01a0515b-8f4a-7412-a151-42d5fb4258d7`.
- **Reviewed content head:** `1adbdabb963ce900fac5445a3cc9ed7380288988` (local == remote == PR head,
  working tree clean at review time).
- **Repair range:** `0bd8ba83..1adbdabb` — `d2b25725` (F-1), `46264f7c` (F-2), `79255394` (F-3),
  `f3b3e75e` (F-4), `1adbdabb` (evidence).
- **Final head reviewed:** `aa822069` (content head `2e8c6f4f`; `aa822069` is run-dir evidence only).
- **Status:** **SIGNED OFF.** T-1 resolved; CI green at the exact head, `mergeStateStatus` CLEAN.

## Verdict per locked defect

| Defect | Disposition met | Evidence I checked myself |
| ------ | --------------- | ------------------------- |
| **F-1** stale `plugins/ai` manifest assertion | **PASS** | `d2b25725` updates `plugins/ai/tests/manifest_test.ts` to assert the *new* contract rather than deleting the test. The brief's cross-plugin sweep was performed and recorded — Design section names a "six-manifest stale-assertion sweep". `check-test` is green at head. |
| **F-2** stream factories broke Aspire discovery | **PASS** | `46264f7c` deletes `requiredStreamsBaseUrl()` in all four plugins and passes `options.baseUrl` straight into `buildStreamUrl`, restoring the `getStreamsUrl()` chain. Four `factory-discovery_test.ts` files prove both arms (omitted `baseUrl` resolves via `services__streams__http__0`; explicit `baseUrl` still wins) and restore env in `finally`. No `4437` literal reintroduced in any factory. |
| **F-3** CLI announced a template port | **PASS** | `79255394` prints the port only when `plugin.hostPort !== undefined` and otherwise directs the user to the Aspire dashboard; `servicePort` stays in the result shape, so this is presentation-only as specified. 92 lines of command tests cover both arms. |
| **F-4** line-scoped fitness gate | **PASS, and better than asked** | `f3b3e75e` moves `CONTRIBUTION_PORT_FALLBACK` to full-text matching with real line numbers via `lineNumberAt`/`sourceLineAt`, and the author independently found and fixed the same defect in `LITERAL_HOST_PORT`. RED-first is documented ("16 passed, 2 failed: both multiline calls escaped the line-scoped matchers"). Self-tests cover the multiline fail fixture and the single-argument `ctx.port(resource)` pass fixture. `[^)]*` remains bounded by the first `)`, so full-text matching does not widen it into false positives. |

Process: Design section present with public surface / vocabulary / constants / slice plan /
deferred scope; `PLAN-EVAL: N/A` justified before slice 1; slices committed in the locked order,
each pushed with the explicit refspec and commented on #1740; no test deleted, skipped or
de-catalogued; `deno.lock` untouched; no label, milestone, draft/ready, merge, or close mutation;
no runtime started.

## Findings

### T-1 — `DEFAULT_STREAMS_PORT` missed the locked D-14 deprecation treatment — **RESOLVED at `2e8c6f4f`**

`packages/plugin-streams-core/src/domain/constants.ts:2` still reads:

```ts
/** Default port used by the development streams service. */
export const DEFAULT_STREAMS_PORT = 4437;
```

It has **zero runtime consumers** (the only occurrence in `packages/**`/`plugins/**` source is its
own declaration), yet it carries neither the `@deprecated` marker nor the named 0.0.8 removal
reference that D-14 locks and that every sibling constant already has —
`SAGAS_API_DEFAULT_PORT` (8092), `AUTH_API_DEFAULT_PORT` (8094) and `TRIGGERS_API_DEFAULT_PORT`
(8093) each carry one. This is inside S5's own declared scope: slice 8 of the original wave was
literally "re-export **deprecated** default-port constants".

Not a correctness defect — nothing reads it — and precisely the class of gap the automated gates
cannot see (the fitness gate inspects contribution and entry-port call shapes, not orphaned
constants). Left as-is it is the seam through which a literal drifts back in.

**Required:** give it the same `@deprecated` + named-0.0.8-removal treatment as its three siblings,
or state in the worklog why the streams constant is deliberately exempt.

**Resolution — verified.** `2e8c6f4f docs(streams): deprecate default port export` now reads:

```ts
/**
 * @deprecated Not a runtime fallback; removed in 0.0.8 — see
 * "chore(plugins): remove deprecated default-port compatibility exports in 0.0.8".
 */
export const DEFAULT_STREAMS_PORT = 4437;
```

Same wording pattern as `plugins/sagas/src/constants.ts`, value unchanged, no runtime read
introduced, no consumer re-pointed. D-14 is now applied uniformly across all four constants.

### T-2 — stale `agent-tools.generated.ts` barrel (already steered; see D-23)

Tracked as **D-23**. `quality` / "Generated asset freshness" is the single failing step at
`1adbdabb` (run `33298126889`, job `99221227342`); no `*.generated.ts` was touched anywhere in
`0bd8ba83..1adbdabb`. Cause is a defect in **my** brief, not the implementation. The same thread is
steered to regenerate, re-cut slice-5 evidence at the new exact head, and drive CI green.

## Gate-evidence rules applied to this slice

- The slice-5 evidence table in `1adbdabb` is **stale by construction** once the barrel commit
  lands; only an exact-head table counts.
- Per **D-25**, the container's non-reaping PID 1 (7,734 zombies, 7,562 PPID-1 `sshd`) makes the
  root cancellation-survivor process-survival test a **known-infra red**. It is not attributable to
  S5 and must not be re-run or chased. **Scoped product gates are judged independently of it.**

## Sign-off conditions — all met

1. **Met.** `59728705` committed the authoritative `gen:assets-barrel` output — only
   `agent-tools.generated.ts`, 2 insertions / 2 deletions, landing the CI-expected
   `01b5b9b43a008d21c2dc49fc035358a63f9582156b4af81083f427a9860e7b89`. No hand-edits.
2. **Met.** T-1 resolved at `2e8c6f4f` (above).
3. **Met.** Evidence table re-cut at content head `2e8c6f4f`, and CI is green at head `aa822069`
   with `mergeStateStatus` **CLEAN**: `build`, `check-test`, `code-quality`, `quality`,
   `close-gate`, `core CI lane visibility`, and both `classify` jobs all pass.
4. **Next.** IMPL-EVAL cycle 3 dispatched to a fresh independent Claude · Fable 5 · medium session;
   brief at `slices/s5/impl-eval-brief-cycle-3.md`.

### Local `deno task test` exit 1 — correctly classified, not a defect

The author's exact-head table records `deno task test` as exit 1: 4,282 passed, 2 failed, 19
ignored, with a clean retry reproducing the same two. Both are **host-process failures, not S5
regressions**, and the author changed, skipped, ignored, and narrowed nothing:

- `hybrid-launcher_test.ts` — a test-owned worker descendant survived cancellation as a PID-1
  zombie. This is exactly **D-25**.
- `codex-follow_test.ts` — could not create an inotify watcher, `Too many open files` against a host
  maximum of 128 instances. A second symptom of the same over-subscribed container.

CI, on a clean runner, is green on every job including `check-test` — which independently confirms
both are host-local. Reporting them honestly rather than suppressing them is the correct behaviour
and I am counting it in the slice's favour.

**Verdict: Tier-A signed off.** S5 is ready for the independent IMPL-EVAL. It is **not** yet
terminal human-merge-ready — that requires the cycle-3 `PASS`. This session does not merge,
relabel, or close, and notes for the coordinator that `status:ready-merge` + `impl-eval:skip` are
still live on #1740 from the voided cycle-2 verdict.
