# Slice 2 correction recheck — #751

Recheck your blocking F1 against the current working tree. The job, task, and workflow builder
interfaces and implementations, plus the root-surface interfaces, now make `build()`'s explicit
`this` type conditional on the receiver's own `TConfigured`, exactly following your proposed
pattern. Formatting, the 110-file scoped check, 25 package tests, and the Slice-2 scanner surface are
green; the full scanner still reports only the expected eight Slice-3 findings with `allowCount:0`.

Run the focused initial-vs-ready typestate probes yourself and inspect the correction. Do not edit
source or commit. Update
`.llm/runs/quality-q751-workers-core--codex/slice-2-review.md` with correction evidence and the final
`PASS` or `FAIL_FIX` verdict.
