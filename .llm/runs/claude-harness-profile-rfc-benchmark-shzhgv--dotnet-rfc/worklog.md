# Worklog — claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc

## Design

Run-1 harness reused verbatim (copied, subjects swapped — U-slices in plan.md); subjects H1-H3x
through the real `DotNetRuntimeAdapter` (its three dispatch modes are the run's subject), H4
Bootsharp in-process. MINSTD continuity; correctness identity per rep; run-1 percentile and
warmup conventions.

## PLAN-EVAL

**N/A** per plan.md (owner-directed scope; mechanics locked; no framework source). IMPL-EVAL
mandatory on the ship PR.

## Slice log

- **U1** bootstrap/research/plan (committed 831175d→rebased): .NET 9+10 installed; C1-C10
  findings incl. Hyperlight/componentize/DotNetIsolator status; sandbox-matrix owner ask folded
  in after the Rust-sandbox question.
- **U2** C# variants: exact acc identity (846234426/777999478); NativeAOT 1.44 MB binary,
  fd-publish + .NET 10 file-based verified; DOTNET_ROOT datum (R3-D-2).
- **U3** protocol: 13 series + probes, **0 failures**; H3≡H3x control (6.3 vs 6.4 ms).
- **U4** Bootsharp: publish succeeded on Linux after assembly-name fix (R3-D-3); H4 in Deno:
  boot 98.4 ms, long p50 54.0 ms (native class), 100 measured, correctness asserted.
- **U5** RFC `rfcs/0000-dotnet-task-runtime-paths.md` with the cross-language sandbox matrix.

## Gate results

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| U2 | Cross-language result identity | PASS | acc values above; per-rep asserts in H4 runner |
| U3 | Protocol completeness + 0 failures + control H3≡H3x | PASS | run-all-3 log `failed=0`; results-dotnet.md |
| U3 | results-dotnet.md script-generated | PASS | report-3.ts output |
| U4 | Bootsharp pipeline end-to-end on Linux | PASS | bin/bootsharp artifacts + bootsharp.jsonl |
| U5 | RFC fmt + zero TBD + link integrity (1 prose false-positive `/dev/kvm` triaged) | PASS | gate command output |
| U5 | Fitness/quality gates | N/A | no packages/plugins source touched |
