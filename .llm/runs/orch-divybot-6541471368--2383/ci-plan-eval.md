# PLAN-EVAL round 2 — CI prerequisite repair

**PLAN-EVAL round 2 (CI repair): no blockers.** The plan fixes the missing prerequisite without claiming more about the root cause than the evidence shows.

**What the evidence supports**
- **The failure:** the private failed-job log shows Aspire starting `dotnet tool run garnet-server --port … --lua --lua-transaction-mode` in the PostgreSQL tier. Garnet then exits with `Run "dotnet tool restore" to make the "garnet-server" command available.` That error only appears when a manifest lists the tool but it was never restored, so the missing restored tool is directly proven. The failure happens at aspire-start, before any saga gate, which fits this PR changing only tests and docs.
- **Why the executable path runs at all:** the generated apphost writes the `garnet-server` manifest whenever a cache entry is `Auto` or `Executable`. In `Auto` mode it falls back to the executable when a `docker info` check fails within 3 s. The executable path runs in the apphost directory and needs the pinned tool restored.
- **The helper:** its restore uses a 10 s timeout, `stdio: 'ignore'`, and discards every error. The plan and drift say the cold-restore mechanism is *inferred* from that, not observed. I agree: the suppressed stderr can't prove it, and the plan doesn't claim otherwise.
- **The gap:** existing prep pulls only container images, including `ghcr.io/microsoft/garnet:2.2.1`, and nothing restores the executable tool. The `garnet-coexistence` fixture already restores the tool before startup because the shipped helper is best-effort. The proposed preflight applies the same practice to the main suite.

**Why the fix should work**
- Restoring the pinned `SCAFFOLD_VERSIONS.GARNET_TOOL` under an isolated manifest fills the NuGet package cache and the user-level local-tool resolver cache.
- `dotnet tool run` from another manifest listing the same id and version resolves from that resolver cache without restoring again. That is the claim the second-manifest proof has to show.
- Neither the e2e suite nor the workflow overrides `HOME`, `DOTNET_CLI_HOME` or `NUGET_PACKAGES`. The prep step and the suite run as the same user in the same job, so the warmed caches are the ones Aspire's process uses.
- The existing workflow step already grants `--allow-run=dotnet,docker` and `--allow-write`, so the workflow file needs no change.
- Both tiers call the same prep script.
- The plan keeps every gate as is: no generated product change, no new pin, no gate retry, no readiness or timeout relaxation. The hosted e2e-cli verdict stays required, and no local full scaffold run is planned.

**Implementation requirements I will check in IMPL-EVAL rounds 4 and 5 (not plan blockers)**
1. **The negative control has to hit the orchestration, not just a helper.** Today the main flow sits under `import.meta.main` and isn't testable. Put tier preparation behind an exported orchestration function that both the entrypoint and the tests call, with the process runner injected. Then removing the preflight from that orchestration must turn a test red. A test that only calls a standalone `restoreGarnetTool` would stay green with the preflight deleted.
2. **The failure tests must assert real behaviour:**
   - the exact argv and the isolated manifest contents, using the shared version constant with no copied literal;
   - the 120 s bound actually passed through;
   - a nonzero exit causes a throw;
   - a timeout or kill causes a throw;
   - output is inherited, not swallowed;
   - the restore runs before or independently of image pulls, and no failure is retried.
3. **The isolated manifest must not pick up repo or parent manifests.** Use `isRoot: true` in a run-owned directory under `.llm/tmp`, matching the existing `--allow-write` scope.
4. **The second-manifest proof must be real:**
   - restore once in manifest A;
   - in a separate directory B with only an identical manifest and no restore, `dotnet tool run garnet-server` (for example with `--help` or `--version`) succeeds;
   - record public-safe evidence;
   - ideally add a control where B lists a version that was never restored and shows the same "Run dotnet tool restore" message.
5. **Keep the evidence wording unchanged:** "missing tool proven; cold restore inferred." Don't claim the PostgreSQL runtime tier passed until the coordinator-armed hosted run reports it.

VERDICT: PASS_PLAN
