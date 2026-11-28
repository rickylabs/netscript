# Required mutation protocol — execute only after product continuation

This protocol is part of plan-R2.md. **Not executed during R2 planning.** It
strengthens the source qualification bar; it does not turn baseline RED into a
restored-GREEN claim. R1's reproducer and FAIL verdict remain immutable.

## Exact source and test identity

At the authorized S2/S3 implementation checkpoint, commit the reviewed intended
production changes and regression tests first. Record that full 40-character
commit as H, the branch base, clean owned-file diff, per-file git blobs and
SHA-256 digests for every product/test file involved. Record the full argv and
frozen dependency-lock hashes. H must equal the real current HEAD; no supplied
head mismatch override is acceptable. Tests are the same committed assertions
through the whole sequence. No fake version pins, test edits, test omission or
sanitizer disabling may produce a mutation verdict.

The supervised slice commit/sign-off rules still apply. A mutation qualification
checkpoint is not independent IMPL-EVAL and never authorizes merge/publication.

## Per-mutant sequence and evidence

Use `.llm/runs/orch-divybot-832--sdk-get-context/evidence/mutations/<H>/<ID>/`.
Each directory retains `snapshot.json`, `mutant.patch`, compiler report, test
report, restore verification and restored-GREEN report; raw operational reports
end in `.local.json` and stay excluded. Public normalized derivatives retain
exact exit codes, test identities/semantic messages, source/test hashes and raw
receipt digests without operator paths, addresses, identifiers or usage data.

1. **GREEN H baseline:** run the structured check wrapper and exact targeted
   structured test wrapper at H. Require compiler exit 0, test exit 0, non-empty
   expected selection, no failed/ignored tests and enabled Deno ops/resources
   sanitizers. Save both reports and all committed file hashes before mutation.
2. **Apply one mutation:** apply only the named, reviewed minimal product patch
   to positively identified owned files. Save exact patch/hash and changed-file
   hashes. Assert the patch is non-empty and every test, dependency manifest,
   lock and all other files still equal H. One mutation at a time.
3. **Compiler 0:** invoke `.llm/tools/run-deno-check.ts` over the changed source
   and corresponding committed test files, with `--unstable-kv` (wrapper default)
   and frozen dependencies. Save its report plus actual process exit. Require
   exit 0 and complete non-empty selection. A compile failure invalidates the
   mutation experiment; it is never a successful negative control.
4. **Semantic assertion RED:** run the exact same targeted test command, via
   the allowlisted `test` gate and repository test wrapper, with a fresh child
   report. Require child/compiler checks complete, test exit 1, zero ignored,
   and the matrix's specific assertion/test failing with the stated wrong
   value or causal cancellation observation. Reject processFailure, TS errors,
   connection/fixture errors, test timeout, sanitizer leak, crash, skip, empty
   selection or an unrelated failure. Store the runner receipt, child report,
   expected/actual test-name set and semantic failure classification.
5. **Restore in finally:** restore only the enumerated mutated paths from H
   (for example `git restore --source <H> -- <owned-paths>`), even if a preceding
   step fails. Recompute hashes from actual bytes and compare each against
   `git show <H>:<path>` and snapshot.json. Assert current HEAD is still H and
   no owned source/test/manifest/lock diff remains. Never use broad destructive
   checkout/reset, delete a lock/cache, or overwrite another lane's work.
6. **Restored GREEN:** repeat the exact compiler and targeted test commands.
   Require compiler 0, test 0, full expected count, zero ignored and no
   sanitizer/resource failure. Save restore.json and both GREEN reports. A
   restore claim without byte equality and this actual GREEN run is unproven.
7. **Publishable evidence:** run the named per-slice LEAK gate on committed
   run content and the complete added source patch; scan the mutation artifacts
   before they enter the public commit. Manifest all public evidence. A failed
   or ambiguous control requires repair/review, not a reported PASS.

Command shapes (fill H, ID and explicit owned file/test selections):

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts --file <source> --file <test> --ext ts --deno-arg --frozen --output <ID>/compiler.local.json
deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate test --id <mutation-attempt> --git-head <H> --runner sdk-2610-mutation --timeout-ms 60000 --output <ID>/red-receipt.local.json --child-report <ID>/red-report.local.json -- --frozen --unstable-kv --report-output <ID>/red-report.local.json <test>
```

Use new invocation IDs/outputs for baseline and restored GREEN; never reuse a
receipt or reinterpret a previous failure. A 60-second process limit is only
an infrastructure bound, not a semantic oracle. Targeted tests use bounded
event observations and clean up pending promises/listeners/timers in finally.

## Mandatory mutant matrix

| ID | Single product mutation | Required semantic failure |
| --- | --- | --- |
| M-CACHE | Replace the no-store group's projected cache with default/absent. | Authenticated/public no-store wire-init assertions fail with the wrong cache. |
| M-METADATA | Omit metadata-cache materialization before direct dispatch. | Metadata-only no-store **with a signal**, which bypasses dedupe, loses no-store. An unsignalled group is not sufficient to test this mutation. |
| M-INIT-SIGNAL | Overwrite outgoing init.signal with undefined. | The explicit init.signal assertion fails; do not falsely claim that alone proves effective Request cancellation failed. |
| M-EFFECTIVE-SIGNAL | Remove the effective signal from both the encoded request and outgoing init on the direct path. | Pending request abort/elapsed deadline no longer cancels actual Fetch work. Causal observation assertion fails while the survivor/cleanup controls still execute. |
| M-SIGNAL-ELIGIBILITY | Remove the no-signal eligibility guard. | Independently signalled/mixed callers and both queryUtils different-key/client controls fail transport count or independent cancellation. |
| M-SIGNAL-SOURCE | Consult context.signal instead of the **encoded standard request.signal** in eligibility. | TanStack/top-level signal with absent context.signal is incorrectly deduped; queryUtils and top-level/context precedence assertions fail. |
| M-CACHE-ISOLATION | Combine no-store and default calls into one group/context. | Same-method/URL/input/identity calls with distinct effective cache modes share a fetch or get the wrong cache. |
| M-ACTUAL-GET | Remove the adapter's actual encoded-method GET guard while logical method remains GET. | Two identical oversized logical GETs encode via the existing native POST fallback; mutant incorrectly coalesces them (1 fetch versus 2). Require observed POST method before the failing count assertion. Native POST remains a separate control. |
| M-DEFAULT-CATCHALL | Change the default group's exact-match condition back to always true. | S1's strengthened group contract fails: default must reject force-cache and no-store. This kills the old catch-all assertion deliberately, even when earlier groups would usually match first. |
| M-EXPLICIT-OVERRIDE | Treat required-auth metadata no-store as overriding explicit caller force-cache or only-if-cached. | Explicit precedence cases observe the wrong forwarded cache. For only-if-cached retain native Fetch compatibility/error semantics; do not turn a platform mode error into no-store success. |
| P-INNOCUOUS | Add an inert documentation-only comment to an owned source file, changing its byte hash without changing behavior. | Compiler stays 0 and **all the same tests stay GREEN**, zero ignored. Then restore H exactly and run GREEN again. A mutation harness that reports every edit as RED fails this positive control. |

Each negative mutant must be killed by its declared assertion. Do not aggregate
distinct mutants, weaken a red assertion, use a TS error as RED, or claim the
planned matrix was executed during this planning-only R2 correction.
