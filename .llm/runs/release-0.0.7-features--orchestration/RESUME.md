# RESUME CHECKPOINT — features orchestrator (rewritten 2026-09-02 ~10:40Z)

## Exact state

| Thing | Value |
| --- | --- |
| `main` | `77ad823dc` (#1910) — moves fast, always re-fetch |
| Topic branch | `orchestrator/release-0.0.7-features`, worktree `007-features` |
| Route | Opus 5 · xhigh · supervise-only · never merge |
| Eval routes | IMPL `z-ai/glm-5.3-flash` · max; PLAN `qwen/qwen3.8-flash` · max |

## Every Features-owned milestone issue has active work or a measured dependency

| Issue | Vehicle | State |
| --- | --- | --- |
| **#1452** | PR **#1842** `d1697421c` | **Merge packet delivered** (comment `5508264615`). All static gates green; postgres runtime red is **#1844**, proven, second reproduction. sqlite gate queued. |
| **#1352** | PR **#1915** `a6fababde` | Non-draft; `check-test`+`quality` green. IMPL-EVAL running at `88df4839e` (run `33617695217`) — delta to head is **generated carriers only**, so the product verdict carries by byte-identity. `close-gate` red only on the honest unticked "IMPL-EVAL passes" DoD box. |
| **#1590** | PR **#1895** `31f4ff8a1` | MutationObserver + teardown-abort both **fixed and confirmed hosted** (`viteStderr: ""`, `overlayCount: 0`, barriers `cancelled: 0`). One assertion left: `dynamicMarkers` all `null`. Worker resumed to determine (a) hydration consumes the markers → test bug, or (b) `KeyedPartial` isn't registering → **product defect in merged #1848**. |
| **#1355/#1360** | PR **#1664** | Converging onto `77ad823dc` (was 44 behind, `CONFLICTING`). Holds IMPL-EVAL **PASS** at `377811da8`; worker must prove byte-identity carry or say it is void. |
| **#1897** | PR **#1918** `5ae37a143` | Opened non-draft, full labels, milestone, `Closes #1897`. One line: `"tests/"` added to `packages/fresh/deno.json` excludes. |
| **#1354** | plan PR **#1891** `f23ca6c05` | **PLAN-EVAL dispatched** (comment `5508205019`). Implementation stays behind #1664 by the plan's own **D9**, not by caution — #1664 is rewriting `packages/cli`. |
| **#1349** | — | S1/S2/S3 all merged (`#1834`/`#1841`/`#1886`); ten acceptance boxes unticked; **no open PR to carry an evidence block**. Audit worker running in `007-leaf-1349-audit` to produce a truthful row-by-row verdict. |
| **#1353** | — | Worker running. Amended scope: a **proof** slice — do NOT ship `traceContextContribution()`, do NOT move injection out of the transport. Audit-first: `traceparent`/`tracestate` are already in `RESERVED_HEADERS`. |
| **#1467** | — | Worker running. New locale contribution owning `accept-language`. Told to **stop and report** rather than edit `prepared-call.ts`. |
| **#1348** | — | Epic. Receives no leaf PR; stays open until every child is verified. |

## Live workers — all detached, all measured alive at checkpoint

| Worktree | Thread | Route | Slice |
| --- | --- | --- | --- |
| `007-leaf-1590-s2` | `01a060be-6b53-7962-88a2-f80a51a4010a` | Sol · medium | #1895 `dynamicMarkers` |
| `007-leaf-1664` | `01a0585d-94e1-70b0-a1c2-6f9654179b0e` | Sol · high | #1664 convergence |
| `007-leaf-1353` | `01a061a8-2a71-7f33-be7e-72b314c5619c` | Sol · medium | #1353 |
| `007-leaf-1467` | `01a061a8-2a32-7733-86fc-2789efcb5dd1` | Sol · high | #1467 |
| `007-leaf-1349-audit` | see `slices/1349-audit/codex-thread-ids.md` | Sol · medium | #1349 acceptance audit |

## Traps — the ones that cost time today

1. **`launch-codex-slice.ts` / `codex-resume.ts` block for the child's whole lifetime.** A
   foreground call dies at the Bash tool timeout and **SIGTERMs the worker**. Always
   `setsid nohup … &`. Recovery is **resume the same thread id**, never relaunch — context and
   uncommitted worktree state both survive.
2. **The launcher does not `mkdir` `--slice-dir`.** It starts the thread, then crashes writing
   `codex-thread-ids.md`, leaving a live sender lease and a thread that never got its brief. Create
   the dir first, and give every slice its **own** dir — a shared one silently overwrites the
   previous slice's thread record.
3. `--slug X` stages to `/home/<user>/X-brief.md` with `codex` hardcoded; under `--user node` pass
   `--dest` explicitly.
4. `git worktree add -b <b> <p> origin/main` inherits `origin/main` as upstream and git-safety
   refuses it — `git branch --unset-upstream` first.
5. **A re-stack that keeps "our" side of a file this branch does not own re-introduces a stale
   snapshot**, and it survives every later clean merge silently. #1842 carried a duplicated
   README section this way for two integrations.
6. **Draft PRs get no real CI** (`ci.yml` gates on `draft == false`). #1915 sat in draft looking
   green and proving nothing; promoting it immediately exposed a real `quality` failure.
7. **After changing any README or docs page, run the whole cascade** —
   `prose → assets-barrel → publish-assets → mcp-export-corpus` — not the one gate CI shows. The
   `check:*` forms are `gen && git diff --exit-code`, so verify them **after committing**.
8. `gh pr ready` fails on this token; use GraphQL `markPullRequestReadyForReview`.
9. Sender-ownership refusals: measure liveness (rollout mtime + `/proc/<pid>/cwd`), never infer it
   from the refusal. Three today were all `owner_inactive` and all the slice's **own** prior thread.

## Cross-lane findings raised, not absorbed

- **#1844** — second independent reproduction of the `runtime.wait.garnet` 300 s timeout, from
  #1842's head. Comment `5508166737`.
- **#1920** (new, `orchestrator:internals`) — `check:mcp-export-corpus` is in
  `.llm/tools/gates/catalog.ts` but wired into **no** workflow, and `main` `77ad823dc` is stale
  again (regenerates to `eb026322…` / 7803 on a clean detached worktree). The #1862 class recurred
  because nothing on the merge path enforces it.

## Standing rules

- Never merge; the primary coordinator merges.
- Never hand-tick acceptance boxes — evidence block + `status:ready-merge` + rerun the existing CI
  run at the **unchanged** head.
- Label leaves at PR-open, never at finalization: coordinator audits key on `orchestrator:features`.
- A closing keyword only on a PR that fully resolves an issue, never on an epic.
