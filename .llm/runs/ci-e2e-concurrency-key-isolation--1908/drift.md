# Drift log — #1908 runtime concurrency-key isolation

Append-only record. No scope expansion is authorized.

| Date | ID | Severity | Observation | Disposition |
| --- | --- | --- | --- | --- |
| 2026-09-02 | D-01 | tooling | The repository-required `rtk` executable is absent from this host. | Use direct non-interactive commands. Durable evidence uses real captured exits and raw output, so the verdict source is unaffected. |
| 2026-09-02 | D-02 | informational | Cross-topic Aspire-lane investigation after dispatch established four operator facts: stale-branch label edits dispatch runtime jobs; cancel-and-redispatch is usually net-negative; job-level skipped tiers never claim the mutex; and merging `main` succeeds where workflow-file cherry-picks may be refused without PAT `workflow` scope. | Incorporate all four facts in the existing workflow Queue policy header. Product scope and the two-literal implementation remain unchanged. |
| 2026-09-02 | D-03 | evidence-bound | #1839's three-arrival acceptance proof was valid during its observation window because no stale-workflow arrival occurred in that window. It does **not** generalize to repository operation while mixed workflow versions are live. | Bound the proof to its observed window; #1908 supplies the missing mixed-generation isolation. |

## Architecture / doctrine drift

N/A. This slice changes workflow infrastructure and harness run artifacts only; it touches no
`packages/**` or `plugins/**` path and creates no architecture debt.
| 2026-09-02 | D-04 | boundary | The merge-vs-cherry-pick asymmetry rescues only branches **adopting** an already-merged workflow fix; **authoring** one still requires PAT `workflow` scope. This slice's own commit was refused for exactly that reason, and both the internals and Aspire sessions hold `repo` only. | Documented in the workflow header so a reader does not conclude the scope wall is a non-issue. The commit needs an owner push; it is not a defect in the change. |
| 2026-09-02 | D-05 | validation | Live confirmation of the fix's premise while it was still unpushed: after all three offender branches integrated `main`, an arrival from a now-fixed branch (S8 `daa4dad4d`) **deferred behind** PR #1889's running docker tier instead of evicting it — the third eviction did not occur. | Records that a fixed-generation arrival is non-destructive, which is the behaviour the `-v2` key preserves across the transition. |
