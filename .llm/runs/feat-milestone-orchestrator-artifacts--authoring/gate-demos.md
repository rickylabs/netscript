# Gate demonstrations — proof-of-firing for the two undemonstrated rules

Recorded 2026-08-03 during Sol eval cycle 2 (findings C7, M4): both gates the profile carried
without a demonstrated negative case are exercised here — one synthetically, one on live GitHub
data. Referenced from `workflow/milestone-run.md`.

## Demo 1 — pre-merge check 3: new-ignore scan with `.llm/runs/**` exclusion (C7)

Synthetic diff with two hunks: a new `// deno-lint-ignore no-explicit-any` in
`packages/example/src/thing.ts`, and a run-artifact line in `.llm/runs/some-run/worklog.md` that
*quotes* the string `deno-lint-ignore`.

Scan of added lines for `deno-lint-ignore|as unknown as|@ts-ignore`:

| Variant | Result |
| --- | --- |
| No exclusion | 2 hits — the real ignore **and** the run-artifact quote (the false positive the exclusion exists for) |
| With `.llm/runs/**` exclusion (the gate as specified) | 1 hit — `packages/example/src/thing.ts: +// deno-lint-ignore no-explicit-any` → **RED, exit 1** |
| Same gate on a diff containing only the `.llm/runs/**` hunk | 0 hits → **GREEN, exit 0** |

**Conclusion:** the predicate fires on a genuinely new ignore in publishable source (negative
case shown), stays silent on excluded-path quotes (the observed 0.0.4 false-positive class), and
a clean diff passes — RED, GREEN, and excluded-GREEN are all distinguishable.

## Demo 2 — #1142 false-red selection rule on live data (M4)

PR **#1155** (merged 2026-08-03 **15:49:19Z**) — its `statusCheckRollup` for the check name
`classify changes` contains, verbatim:

| startedAt | Conclusion | Relation to merge |
| --- | --- | --- |
| 15:33:44Z | SUCCESS | pre-merge |
| 15:34:08Z | SUCCESS | pre-merge |
| 15:34:17Z | SUCCESS | pre-merge |
| 15:34:49Z | SUCCESS | pre-merge |
| 15:42:19Z | CANCELLED | pre-merge, superseded 17s later |
| 15:42:36Z | SUCCESS | pre-merge — **latest pre-merge run** |
| 15:49:34Z | CANCELLED | **post-merge** (+15s) |
| 15:49:47Z | FAILURE | **post-merge** (+28s) — the #1142 corruption |

A naive rollup read sees a FAILURE and two CANCELLEDs on a merged PR — false red. Applying the
rule exactly as the profile states it — *compare check-run timestamps to the merge time* (drops
the 15:49:34/15:49:47 post-merge runs), *then take only the latest run per check name* (drops the
superseded 15:42:19 CANCELLED in favour of 15:42:36) — yields **SUCCESS**, the true pre-merge
verdict.

**Conclusion:** both clauses of the rule fired on live data — post-merge exclusion caught a real
#1142-class corrupted run, and latest-per-name selection caught a real superseded run — and the
false-red (naive) and true (selected) verdicts are distinguishable.
