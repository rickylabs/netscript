# Worklog

## Design

Public contract remains CacheEntry.DataPath. The existing generator composes upstream AOF/recovery/commit flags at each Garnet launch edge, with /data in containers and resolved host DataPath for executable. No new runtime abstraction. Durable writes wait for native AOF flush; ephemeral mode preserves existing argv. Tests use emitted configuration and real queue delivery after restart, including a checkpoint plus later AOF tail. Docs state modes and latency/retention behavior. PLAN-EVAL N/A for this locked native configuration passthrough; mandatory independent final evaluation.

Fresh main b0eb07957 confirmed before branch creation. Pinned server help verified in an owned auto-removed container. Baseline static/runtime regressions next; no product implementation.


## Main baseline reproduction

Static controls: all three no-DataPath cases pass; Container/Executable/Auto DataPath cases fail because generated argv lacks AOF/recovery. Real AOF-only queue regression on unchanged main source: both jobs are ready before an owned hard restart; the restarted server answers PING, then delivers zero jobs instead of two. This is a genuine data-loss failure after readiness, not a boot/network failure.

Two fixture problems were corrected before counting runtime evidence: a direct ioredis import was not declared in CLI (replaced by native Deno TCP for PING/SAVE; queue uses its own existing dependency), and Docker reallocated the dynamic published port on restart (re-read after start). Those bootstrap failures are excluded. Checkpoint control independently exposed pinned native4K alignment failure matching upstream2239; it is also excluded from proof of the missing-AOF finding. Durable policy includes supported FileStream plus storage-tier per the confirmed upstream workaround, with common log/checkpoint directory. No version change.

Each runtime test verifies immutable container/volume IDs and unique ownership labels before cleanup. Post-run Docker scans show no test-owned containers or volumes. All other resources are untouched. Raw server logs are not retained in public run evidence.


## Generator implementation and live recovery

Added one native durable flag set shared by container and executable generation; DataPath selects AOF/recovery, immediate flush acknowledgement, FileStream and storage-tier. Both paths use one log/checkpoint directory. Executable now imports/uses the existing resolveDataPath helper; no-path output keeps existing Lua/endpoint behavior.

Combined generator and persistence suite33/33 pass, including both real owned-container AOF-only and checkpoint-plus-AOF-tail restart/delivery cases. Both jobs are delivered and acknowledged after hard restart. This also verifies the pinned device configuration workaround. Structured changed-file check/lint pass. Public CLI/guide docs describe durable/ephemeral modes and latency, native checkpoints, retained directory and external-server ownership. No dependencies or lock changes.

Formatting decision: the edited generator already uses semicolon-free style on main. Preserved that style through a temporary formatter config identical to CLI quality except fmt.semiColons:false; the structured formatter passes on both base and repaired generator. New test uses canonical CLI quality format and passes. This avoids a425-line unrelated formatting diff; the functional generator diff is43lines. No repository formatting policy changed.


## Package gates

quality:gate, release:preflight and docs:accuracy pass. CLI JSR audit/dry-run passes with25 existing doctrine/slow-type warnings; CLI doc lint is zero on both baseline and head. Structured check/lint and both style-scoped format checks pass. No lock churn. An additional private whole-output comparison could not load the detached baseline import graph because its workspace alias was unavailable; excluded as a fixture failure, with no assertion about byte-identical output. The three no-path regressions and25 adjacent generator tests remain the unchanged-behavior evidence.

Ownership teardown preview reports zero run-owned cleanup commands. Foreign/unknown resources are left untouched.


## Generated consumers

Canonical prose, MCP export corpus, CLI asset barrel and publish assets refreshed in dependency order. Only prose carrier was dirty when --allow-dirty was used for export generation; warning reviewed. Corpus and publish freshness pass. Only the prose and MCP publish carriers change; template/barrel and symbol corpus remain current. Next one final full runtime smoke with cleanup, then independent evaluation.


## Final full runtime attempt

Final full scaffold.runtime one-pass local command exits1: documented-scaffold Postgres never becomes healthy within300seconds. Cleanup gate passes. This shell had no local Docker socket; the known remote daemon is reachable, but this host does not satisfy the generated AppHost's local-Docker contract. No guard or product behavior changed; no full local pass claimed. Follow-up read-only leak/teardown reports zero run-owned cleanup commands, foreign resources untouched. Final supported-runner workflow [43940698080](https://github.com/rickylabs/netscript/actions/runs/43940698080) at3ab21381d is still running; desktop/static lanes already pass. Independent final evaluation awaits the complete runtime verdict.


## Supported final runtime verdict

[Workflow43940698080](https://github.com/rickylabs/netscript/actions/runs/43940698080) completes SUCCESS at source head3ab21381d. [Postgres full runtime](https://github.com/rickylabs/netscript/actions/runs/43940698080/job/133557631938) and [SQLite full runtime](https://github.com/rickylabs/netscript/actions/runs/43940698080/job/133557632129) both succeed, alongside scaffold-static and desktop-native packaging. No guard bypass or substituted gate. Local partial evidence remains recorded honestly. All four issue acceptance boxes have linked red/green runtime/generator/docs evidence in the IMPL comment. Follow-up commit records evidence only; no product/test/doc change after this green source head. Independent final IMPL-EVAL next, then ready transition and current required head checks/review-thread gate.


## Independent implementation verdict

[Separate-session IMPL-EVAL PASS](https://github.com/rickylabs/netscript/pull/2643#issuecomment-6927774411) at1e16cc31d. GLM5.3Flash/provider-default matches pinned primary and is independent from OpenAI generator. Evaluator independently executes33/33 live generator/persistence tests, verifies pinned flags, scoped typecheck47files, quality, preflight, docs accuracy, doc lint zero, JSR audit/dry-run and supported full smoke source invariance. No blocking findings; only existing sibling format drift and non-blocking CI annotation. Owned resource scan empty. Final evidence-only verdict commit precedes ready-for-review transition; verify current required checks and review threads after transition.


## Required head-check repair

Ready transition exposed required quality:cli formatting failure on the touched generator. Canonical normalization is necessary; earlier legacy-style justification is superseded (see drift.md). Canonical formatter output of the evaluated generator equals the current generator exactly. Only the existing generator is normalized; CLI-wide baseline drift is untouched. quality:cli passes canonical lint1289files/fmt1164files. Combined generator/persistence suite33/33 passes with deterministic20-second PING readiness and failure-phase diagnostics. One preceding connection-refused readiness failure is recorded as fixture/bootstrap evidence, not a durability verdict. Enqueue/hard restart/delivery/ack assertions and5-second delivery bound unchanged. Supported full runtime remains valid at semantically identical generated output; no expensive smoke repeat for formatter-only delta. Final evaluator follow-up will verify this narrowly.


## Final independent follow-up

[Cycle2 IMPL-EVAL PASS](https://github.com/rickylabs/netscript/pull/2643#issuecomment-6928484888) at7cbcfbd3a independently confirms canonical formatter equivalence and33/33live runtime tests, readiness-only fixture change with delivery oracle unchanged, zero owned resource residue. Required quality succeeds at that head; deps-report policy-skipped. Review-thread gate0threads/0unanswered. All issue acceptance and PR completion evidence complete. Verdict-retention commit changes run artifacts only; final required-head checks must be confirmed after push, no source change or extra full smoke.
