# Independent IMPL-EVAL round 4 — CI prerequisite repair

**IMPL-EVAL round 4 (CI Garnet prerequisite repair): no blockers.** I sign off on the slice. Every requirement I set in PLAN-EVAL round 2 is met.

**The source change**
- **Size:** only `.llm/tools/e2e/prepull-runtime-images.ts` and its test change. There are no product, generator, workflow, version-pin, lock or suite-assertion changes.
- **Restore step:** `restoreRuntimeGarnet` writes an `isRoot: true` manifest listing `garnet-server` at the shared `SCAFFOLD_VERSIONS.GARNET_TOOL` pin (2.2.1), with no copied literal. It then runs `dotnet tool restore --tool-manifest <that manifest>`. The default directory is under `.llm/tmp`, and the repo root has no competing `.config` manifest.
- **Failure handling:**
  - The separate `GARNET_TOOL_PREPARATION_TIMEOUT_MS = 120_000` bound is enforced through `AbortSignal.timeout` on the spawned process.
  - stdout and stderr are inherited, not swallowed.
  - A nonzero exit throws.
  - A timeout either kills the child, which yields a nonzero code and throws, or rejects and propagates.
  - There is no retry.
- **Orchestration:** the entrypoint now only calls the exported `prepareRuntimeTier`, which:
  - resolves the image list;
  - restores the tool before any pull;
  - keeps the original pull, retry and report behaviour.

  The report directory is now derived from the report path, which matches the existing default. The workflow step's existing `--allow-run=dotnet,docker` and write grants cover the new step.

**The tests**
- Both tier tests assert:
  - the exact argv;
  - the manifest contents;
  - the 120 s bound;
  - inherited output;
  - a single restore;
  - the final report.

  The fake `pullImage` refuses to run unless the restore has already happened.
- The exit (17), killed (137) and timeout cases each restore exactly once, pull nothing, write no report, and fail with the expected error.
- The original image tests are kept, including the one checking workflow ordering. Result: 11 passed / 0 failed / 0 ignored.
- **Negative control:** the patch removes only the orchestration call and keeps the helper and the tests. Both tier tests fail, 0 passed / 2 failed, on the message "the executable fallback must be restored before images". So the tests guard the entrypoint path, not just a standalone helper. That was my PLAN-EVAL round 2 condition 1.

**The real SDK proof, read from the private files**
- It used a fresh .NET CLI home and a fresh NuGet package folder, so no inherited cache could make the check pass falsely.
- Consumer B, holding only the pinned root manifest, first fails with the exact `Run "dotnet tool restore"…` message, exit 1.
- The restore function then restored the tool in a separate directory A, in 7179 ms, and filled the resolver cache with an entry for `garnet-server`.
- B then prints Garnet's `--help` output, exit 0, without restoring B.

This is the second-manifest resolution the generated apphost relies on. The evidence correctly avoids claiming the hosted run went over the helper's 10 s restore bound.

**Gates and records**
- check, lint and fmt each selected both files, with zero findings and nothing dropped.
- The lint config was adjusted only to lift the root `.llm` exclusion.
- The `quality:gate` receipt shows PASS, exit 0.
- `drift.md`, `plan.md`, `supervisor.md` and `worklog.md` record the scope extension. They say the missing tool is proven and the cold restore is inferred, and they separate the unrelated desktop-lane failure on main.
- The new run files contain no absolute machine paths, hostnames, ports or session ids.

**Not blocking**
- The timeout test simulates a rejected promise. The real runner most likely resolves with a signal exit code after the abort kills the child. Both paths fail loudly before any pull, so this doesn't change the behaviour.

The PostgreSQL runtime tier is still unproven until the hosted e2e-cli run passes on the repaired head. Round 5 must attest the exact pushed SHA.

VERDICT: PASS
