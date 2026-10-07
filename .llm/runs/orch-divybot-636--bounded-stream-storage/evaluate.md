# Evaluation (FINAL): NetScript #2080 / harness #636 — bounded native durable-stream storage I/O

Round 1 is preserved verbatim in `evaluate-round-1.md`; the F1–F5 repair review is preserved in
`repair-checkpoint.md`. This file is the final IMPL-EVAL and supersedes neither of them.

## Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `orch-divybot-636--bounded-stream-storage` |
| Target | `plugins/streams/services/src/**` — bounded native append-log I/O at the streams service seam |
| Archetype | `5 — Plugin Package`, service scope overlay (dependency-specific adapter, not a framework convention) |
| Evaluator | native Claude Opus 5 (`claude-opus-5`, xhigh), session `507f3317-ba68-4e62-b085-89eb707037de` |
| Generator | Codex `sol` (OpenAI family) — **different vendor family and different session in every cycle**; this is an independent review, not self-certification |
| Rounds | round 1 `FAIL_FIX` → repair checkpoint (interim, no verdict) → round 2 FINAL, same evaluator session throughout |
| Final candidate head | `48aa35fd8f854df6f6140844d96bbfefb70ad45f` |
| Commit trail | `7956710` plan · `6aa1676` implementation · `c12a520` security lock repair · `48aa35f` regression repairs |
| CI merge ref | `4f626395f9413a35a4c80fa6d07c4e15899a6207` = "Merge 48aa35f into 6f6cbdf"; parents are the baseline and the candidate, and `main` is still `6f6cbdf`, so `pull_request` CI ran the candidate **merged into current main** |
| PR | rickylabs/netscript#2081, `headRefOid == 48aa35f`, base `main`, not draft, `MERGEABLE` |
| Verdict | **PASS** (see § Verdict for the required pre-merge bookkeeping) |

### Source identity across all three reviews

Production source has not changed since my first substantive review of `6aa1676`; only tests, the
debt entry and run artifacts moved. sha256, re-verified at verdict time with a clean
`git status` for `plugins/`, `.llm/harness/` and `deno.lock`:

```
7b3c128cb6fddf889c5faa8700836f0c08c8bfa37f52a79c46b23b92b25f287c  services/src/bounded-file-store.ts   (unchanged 6aa1676 → 48aa35f)
3e488a97081500b3fcd8632ee961c0b84835563c842a0f8c0689c3837957cbd7  services/src/bounded-segment-log.ts  (unchanged)
eea48a42aa06c5fda4bfe123434367eece00cf143fd0afe35d7c118975dbfbbb  services/src/main.ts                 (unchanged)
c1b63c9087662f9669b5ed353c890879c3805e0b641e984e22be1805675192aa  services/src/tests/test_utils/storage-rss-worker.ts (unchanged)
14834a065310ff7b12eb617006debd8a50088f67ac57141aa0fcbcab0f668f64  services/src/tests/storage-rss_test.ts (unchanged)
d6824ee98e2da835268863e7adc61fe0d6479e87cc59d52ccfbbd5ba1129d4ff  services/src/tests/bounded-file-store_test.ts   (F4 repair)
36512b1e6258f1df76505171707acd6ae6c9b523f23b83f795bc371bf7549b0f  services/src/tests/bounded-segment-log_test.ts  (F1–F3 repairs)
```

## Dependency ground truth (established independently in round 1, unchanged)

| Fact | Evidence |
| ---- | -------- |
| Resolved version is **0.3.7** | `deno.lock` → `npm:@durable-streams/server@~0.3.7` → `0.3.7`; `plugins/streams` `packageJson`. The run's initial "0.3.8" claim was corrected in `research.md` + `drift.md`; conclusions unaffected. |
| Exactly two full-file read sites exist | `grep readFileSync` over 0.3.7 `src/*.ts` → `scanFileForTrueOffset` (`file-store.ts:405`) and `readMessagesFromSegmentFile` (`:1564`). No other full-file read path. |
| Both are plain prototype methods at runtime | `dist/index.js:1103`, `:1784` on `FileBackedStreamStore = class { … }`; the adapter's own descriptor check fails closed otherwise. |
| Offsets are frame-inclusive | 4-byte BE length + payload + 1 trailer; native advances `+= messageLength + 5`; recovery adds the `forkOffset` base. |
| `dataDir` only selects the store | `grep dataDir dist/index.js` → `:3179` store choice, `:3185` stored and never read again ⇒ `super({…options, dataDir: undefined})` is behaviour-preserving apart from the store instance. |
| Segment paths are unique per incarnation and append-only | `generateUniqueDirectoryName()` = `encoded~base36(now)~8hex`; creation uses `openSync(path,'wx')`; deletion removes the directory. |
| Hooks byte-identical in 0.3.8/0.3.9 | `diff` of both method bodies 0.3.7↔0.3.9 → identical, so the committed `~0.3.7` range cannot silently change hook shape today. |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate satisfied before implementation | `PASS` | `worklog.md` `PLAN-EVAL: N/A` with justification, committed in `7956710` **before** any implementation commit; justification sound (the issue supplies framing/offset/acceptance semantics; no public or storage contract redesign). |
| Design checkpoint exists in worklog | `PASS` | `## Design`, 7 numbered items (surface, vocabulary, ports, constants, slices, deferred scope, contributor path). |
| Commit slices follow the design | `PASS` | plan → implementation → (owner-authorized security lock slice) → regression repairs; one commit per slice. |
| Each slice has its named gate passing | `PASS` | durable `run-gate.ts` receipts: `quality-gate-committed.json` @ `6aa1676` PASS/0; `audit-critical-repair.json` @ `6aa1676` and `audit-critical-committed.json` @ `c12a520` PASS/0; `review-quality-committed.json` @ `48aa35f` PASS/0 (`gitHead == actualGitHead`). I reproduced `quality:gate` exit 0 at `48aa35f` myself. |
| No speculative seams / dead code | `PASS` | The single injected port is consumed by both the production `Deno` edge and the fault/short-read fixtures; every export is referenced. |
| Constants for finite vocabularies | `PASS` | `HEADER_BYTES`, `TRAILER_BYTES`, `SEGMENT_IO_BYTES`, `MAX_CACHED_SEGMENTS`, `MAX_SEGMENT_CHECKPOINTS`, `SCAN_HOOK`, `READ_HOOK`. |
| Every agent brief carries `## SKILL` | `PASS` | `evaluator-prompt.md`, `evaluator-status-update.md`, `evaluator-repair-checkpoint-prompt.md`, `evaluator-final-prompt.md` all open with `## SKILL`. PR bodies are exempt by rule and were not scored. |
| Review-thread gate | `PASS` | `check:review-threads --pr 2081` exit 0, threads 0 / unanswered 0 (`external-review.md`); the external Augment review is `COMMENTED`, no suggestions, and explicitly did not re-run tests — it supplements, never substitutes for, this evaluation. |
| Evaluator independence preserved | `PASS` | Different vendor family and session from the generator in every cycle; evaluator wrote only `evaluate*.md`, `repair-checkpoint.md` and `evaluator-phase-comment.md`, changed no source, made no commit/push, and sent no GitHub message (read-only `gh`/API inspection only). |

## Static Gates — independently re-run at `48aa35f`

| Gate | Command | Result |
| ---- | ------- | ------ |
| Scoped tests | `run-deno-test.ts -- --allow-all --frozen plugins/streams/services/src` | **18 passed / 0 failed / 0 ignored**, exit 0 (re-run at verdict time; 0 ignored confirms the POSIX-permission test executed) |
| Scoped typecheck | `run-deno-check.ts --root plugins/streams/services --ext ts --deno-arg --frozen` | 14 files, 0 occurrences, exit 0 |
| Scoped lint | `run-deno-lint.ts --root plugins/streams/services --ext ts` | 14/14, 0 occurrences, exit 0 |
| Scoped format | `run-deno-fmt.ts --root plugins/streams/services --ext ts` | 14/14, 0 findings, exit 0 |
| Doctrine / quality | `deno task quality:gate` | exit 0; `streams` `FAIL=0 WARN=5 INFO=1`, every warning pre-existing; the pre-change `F-16` `services/src` cardinality warning is gone |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in `plugins/streams` | exit 0; ships the two adapter modules, no `tests/`/`test_utils/` path; `./services` surface remains **0 public symbols** |
| JSR structural audit | `jsr-audit.log` vs `jsr-audit-initial.log` | 1 finding, the pre-existing `F-JSR-7` slow-types warning; the initial cardinality finding was resolved by the test relocation |
| Doc lint (changed export) | `service-doc-lint.json` | `./services/src/main.ts` → 0 errors / 0 private-type refs / 0 missing JSDoc |
| Doc lint (whole plugin) | `doc-lint.log` | exit 1 from `./mod.ts` and `./src/cli/composition/main.ts` — **pre-existing**, in files this branch never touches; reported as baseline, never claimed green |
| Dependency audit | `deno task audit:critical` | 0 critical (38 total: 3 low / 17 moderate / 18 high), exit 0 |
| Lock hygiene | `git status --short deno.lock` after every evaluator command | clean; evaluator used `--frozen`/`--no-lock`/`--cached-only` throughout |

## Fitness Gates

The repo's own checker is the authority and I re-ran it at `48aa35f` (`deno task quality:gate`,
exit 0). F-1/2/3/5/6/7/9/10/11/12/14/15/16/18/19 `PASS`; F-8/13/17 `N/A`; **F-4 `DEBT_ACCEPTED`**
(two upstream subclasses — see AP-4). No new warning is attributable to this branch; inheritance
depth is 2, so no `A5` multi-level finding.

## Runtime Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Native store semantics on real LMDB + real segments | `PASS` | 4 store-level tests: crash-torn trailing frame, metadata-ahead truncation down to two surviving header bytes, fork + chained fork, JSON `formatResponse`, fork sub-offset, producer epoch/closed state across a real restart, and denied-segment recovery. |
| Real server composition over HTTP with a durable `dataDir` | `PASS` | `PUT`→201, `POST`→204, `stop()`, re-create, tail read at the returned offset → `after`, `offset=-1` → `beforeafter`; asserts both `FileBackedStreamStore.prototype` hook descriptors are identical before and after, i.e. no global prototype mutation. |
| ≥1 GiB Linux RSS ceiling with two unchanged-native negative controls | `PASS` | Reproduced by the evaluator in round 1 and re-measured by the run (`rss-review-measurements.json`): real log 1,073,746,944 B, absolute ceiling 536,870,912 B. Native recovery **2,204,196,864 B** (exit 1); unchanged native tail via `Reflect.apply` on the recovered store **2,205,429,760 B** (exit 1); bounded recovery **59,441,152 B**, after tail **60,530,688 B** (exit 0). All three report the identical recovered offset `0000000000000000_0000001073746944`. |
| **Full one-pass CLI E2E `scaffold.runtime` (F6)** | **`PASS` — exit 0** | See § F6 below: run `37681694541`, job `112999350273`, step 10 `success`, suite report `ok: true`, **104 passed / 0 failed / 0 skipped**, 560,806 ms. |
| Required repo-wide test job | `PASS` | CI `check-test` receipt at the merge ref: `outcome PASS`, **exit 0**, `5433 passed / 0 failed / 14 ignored`, 363,647 ms on `ubuntu-latest` — the whole workspace suite including the 1 GiB regression. |
| Resource hygiene | `PASS` | Local `maint:leak-check` exit 0, only foreign `unproven` resources, none mutated. In CI, `cleanup.aspire-stop` passed inside the suite, so the gate left no AppHost behind. |

## F6 — off-worker runtime gate, verified directly against the immutable run

The local worker genuinely could not run this gate (`aspire doctor`: .NET SDK absent, Docker daemon
unreachable; failure *before* scaffolding). That limitation stays recorded in `drift.md`,
`memory/runtime-preflight.md` and `scaffold-runtime.log`, and was **not** converted into a local
pass. The gate was instead obtained off-worker and I verified it from the GitHub API and the run's
own artifact rather than from the run notes:

| Item | Verified value |
| ---- | -------------- |
| Workflow / run | `e2e-cli`, run `37681694541`, event `pull_request`, `run_attempt 1`, status `completed`, conclusion **`success`** |
| Run `head_sha` | `48aa35fd8f854df6f6140844d96bbfefb70ad45f` — exactly the final candidate head |
| Job | `112999350273` "scaffold-runtime (aspire + docker + postgres)", conclusion **`success`**, 20:30:34Z → 20:40:14Z |
| Raw command | step 10 "Full scaffold runtime E2E (one pass, with cleanup)" = `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json` — the canonical one-pass command plus the suite's native `--report` flag; **not** split into `gates`/individual scaffold commands |
| Raw exit | step conclusion **`success`** on an **unguarded** `run:` step ⇒ process exit **0**. The file's only `continue-on-error: true` belongs to the unrelated `desktop-native` `#859`-bounded job, not to this step. Two independent corroborations: the `if: failure()` step "Print failed E2E gate evidence" was **skipped**, and the suite report carries `ok: true` with zero failures. The job also proves it was not policy-skipped: "Skipped by policy" (`if: env.RUN != 'true'`) was skipped while step 10 ran. |
| Suite report provenance | I downloaded artifact `11509234075` from the run myself: sha256 **`a2e595273a9e8f52bee4150bdfcbe40d47c87136fc18d0e3ccf86c7711c78d0b`**, byte-identical to `reportSha256` in the tracked `scaffold-runtime-ci.json`. |
| Report contents | `suiteId: scaffold.runtime`, `ok: true`, `summary {passed: 104, failed: 0, skipped: 0}`, `durationMs 560806`; all 104 step verdicts are `passed`, none non-passing. |
| Streams-relevant steps inside the pass | `runtime.aspire-restore`, `runtime.aspire-start`, `database.init/generate/seed`, `runtime.aspire-restart-after-db`, `runtime.wait.streams`, `behavior.endpoint-readiness`, `behavior.plugins-health`, `behavior.otel.stream-consumer`, `behavior.streams.producer-reconnect` (10,908 ms), `cleanup.aspire-stop` — all `passed`, each with `exitCode 0` attempts. |
| Sibling tier | `scaffold-runtime-sqlite (aspire + sqlite + garnet)` also `success`; `scaffold-static` `success` beforehand. |

**Scope of what F6 proves — stated precisely so the merge record is not overstated.** The generated
project does not set `STREAMS_DATA_DIR`, and the run's own captured output contains the service's
warning *"Streams service storage is non-durable (in-memory). Set STREAMS_DATA_DIR=<path> to enable
file-backed durable storage."* So the E2E exercised the changed `main.ts` composition on its
in-memory branch (`createStreamsServer` → plain native server) and proves the composition is
non-regressive end-to-end in a real Aspire + Docker + Postgres runtime through stream consumption,
producer reconnect, health and AppHost cleanup. It does **not** exercise the bounded file-backed
store; that path's evidence is the real-LMDB store tests, the real-HTTP `dataDir` restart test, and
the ≥1 GiB subprocess RSS regression. Wiring a durable data dir into the scaffold would be new scope
and is correctly absent from this plan.

## Consumer Gates

| Consumer | Result | Evidence |
| -------- | ------ | -------- |
| `plugins/streams` service entrypoint | `PASS` | 2-line diff; falsy `dataDir` returns the plain native server exactly as native did, so in-memory development behaviour is untouched — now confirmed end-to-end by F6. |
| Published JSR surface | `PASS` | export map unchanged; `./services` still 0 public symbols; adapter shipped as an internal module only. |
| Generated userland / Aspire | `PASS` | `scaffold.runtime` 104/104 and `scaffold.plugin.stream`, `generated.plugins-check`, `behavior.package-backed-plugin-doctor` all passed; no scaffold or Aspire template was changed. |
| Storage format compatibility | `PASS` | No write path touched; append, metadata, LMDB schema, segment naming, trailer byte and offset strings unchanged; `frameOffset()` reproduces the native 16+1+16 format; pre-existing directories recover to identical offsets (1 GiB fixture + restart tests). |

## Semantic review (carried forward from round 1 — production source unchanged)

Line-by-line comparison against 0.3.7 `readMessagesFromSegmentFile`/`scanFileForTrueOffset`:
frame end, inclusion predicate (`base + end > startByte`), cap predicate
(`base + end <= capByte`), fork base/cap plumbing, missing-segment `[]`, incomplete header/payload
stop and corrupt-length handling are all **equivalent**, including `startByte < base`, negative
`startByte` and `capByte < base`. Three divergences are deliberate and safer, and all are documented
in code: a torn trailer is excluded from reads (native `read` could emit a frame beyond the offset
recovery reconciled to); I/O errors propagate instead of returning silently-truncated data; and a
scan error no longer rewrites LMDB. I proved the last one by probe in round 1 — native reconciles
`currentOffset` down to `…_0` where the bounded store preserves `…_8` and self-heals once the file is
readable — and it is now a committed regression test with the native reset as its control.

Verified sound: hook installation ordering (per-call subclass prototype written *before*
construction, so constructor recovery already uses the bounded scan); no global mutation; fail-closed
name guard; `override readonly store` re-assigned immediately after `super()` with `start()`/`stop()`
and `instanceof` still correct; boundary-cache soundness (`positions` is always an ascending list of
verified boundaries and the seek can never skip a message); bounded memory (one 64 KiB window per
synchronous call plus requested payloads; cache ≤ 32 paths × ≤ 128 numbers); short-read loop; and
checkpoint staleness guards whose only theoretical escape is unreachable through this dependency.
**No substantive correctness defect was found in any round.**

## Regression binding — mutation evidence

Round 1 found three documented invariants and one owner-named guarantee that survived total removal
of their implementations with a green suite. At `48aa35f` I rebuilt an independent harness in
`$TMPDIR` (production modules + both committed suites + a local import map pinning the real
`npm:@durable-streams/server@0.3.7`), confirmed a 10/10 baseline, and applied my own faithful source
removals — including splitting the invalidation predicate into its three branches, which the
generator's single mutant did not do:

| Mutation | Round 1 | Round 2 (`48aa35f`) |
| -------- | ------- | ------------------- |
| all invalidation removed | green (unbound) | **exit 1** |
| identity branch only | not probed | **exit 1** |
| shrink branch only | not probed | **exit 1** |
| equal-size/mtime branch only | not probed | **exit 1** |
| per-segment checkpoint cap removed | green (unbound) | **exit 1** |
| short-read loop defeated | weak (fault test only) | **exit 1** (two tests) |
| native fabricated reset restored | untested | **exit 1** |
| frame-inclusive offsets · boundary-verified seek · fork cap rebase · payload header offset · start-exclusive comparison · segment LRU eviction | caught | caught |

Two mutants remain green **by design, not by omission**: tightening `MAX_SEGMENT_CHECKPOINTS`
(expectation and fixture are both derived from the constant, so the test binds the retention
*mechanism* rather than freezing a configuration value) and removing the forced final boundary in
`scan()` (a tail-seek performance characteristic that is nowhere claimed as an invariant). Optional
finding R2-1 (assertion-library diff diagnostics on the large payload comparisons) is reasoned-
declined in the worklog; the tests still compare every byte and reject every mutation, and no
assertion or negative control was weakened to achieve that — I accept the decline.

## Anti-Pattern Check

`CLEAR`: AP-1, AP-2, AP-3, AP-5, AP-6, AP-7, AP-8, AP-9, AP-10, AP-11, AP-12, AP-13, AP-14, AP-15,
AP-16, AP-17, AP-18, AP-19, AP-22, AP-23, AP-24, AP-25. `N/A`: AP-20, AP-21.
**AP-4 `DEBT_ACCEPTED`** — `BoundedStore extends FileBackedStreamStore` and
`BoundedServer extends DurableStreamTestServer` are cross-package implementation inheritance,
recorded as `STREAMS-BOUNDED-NATIVE-IO-HOOKS`. AP-11 deserves special mention: no hidden global is
introduced, the cache is per-store-instance, and the untouched upstream prototype is asserted by
test.

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 1 | `STREAMS-BOUNDED-NATIVE-IO-HOOKS`, complete on every required field (ID, Reason, Owner, Target, Linked plan, Created, Status `open, DEBT_ACCEPTED`, Gate, Cost). `Reason` now names **`AP-4` cross-package implementation inheritance / `A11` dependency coupling**, so a catalog-code grep finds it, and `Cost` now requires re-running the native integration and ≥1 GiB RSS negative-control suites on every dependency bump (round-1 F7 absorbed). |
| Resolved | 0 | — |
| Deepened | 0 | — |
| Unrecorded violations | 0 | — |

**Is the two-hook adapter reasonable until upstream offers a seam?** Yes. The defect lives inside two
`private` methods of a class whose constructor performs recovery, and the public constructor offers no
store injection, so composition cannot intercept it and a global prototype patch would change
behaviour for every consumer in the process. A per-call subclass overriding exactly two methods,
installed before construction, guarded by a runtime shape check, asserted not to touch the upstream
prototype, and verified against the unchanged native store for offset equality on a real 1 GiB log is
the smallest viable blast radius — with a concrete removal gate and upstream issue
`durable-streams/durable-streams#420` (verified: OPEN, authored 2026-10-07,
"FileBackedStreamStore buffers entire append log during recovery and tail reads").

## Close-gate verification (protocol rule 12)

Now verified directly rather than taken on attestation:

| Requirement | Result |
| ----------- | ------ |
| Closing keyword in the PR **body** | `PASS` — `Closes #2080` and `Closes rickylabs/harness#636`. The repo's own close-gate recognizes both: "closing reference: #2080 source: body keyword", "closing reference: #636 source: manual link". |
| Referenced-issue acceptance criteria | `PASS` — owner contract (issue #2080 comment `6038014900`): one PR against current main (#2081, base `main`, `MERGEABLE`, `main` still at the baseline) ✔; bounded recovery **and** tail reads streaming the log in fixed-size chunks and reading only the requested tail ✔; a ≥1 GB synthetic log generated in the test temp dir under a measured RSS ceiling **with a negative control that fails on the old full-buffer path** ✔ (two such controls, both exit 1); dependency-level cause patched at the NetScript seam with the upstream issue filed ✔; CI green ✔ (one exception below). |
| Unchecked `gate:` checkbox on a referenced issue (the #260 failure) | `PASS` — issue #2080 carries no `gate:` label and no `gate:` checkboxes; its pre-submission checklist is fully checked; `acceptance-mirror APPLIED: no changes`. |
| Taxonomy + milestone | `PASS` — PR labels `type:fix`, `area:plugins`, `priority:p1`, exactly one `status:` (`status:impl-eval`), plus the `e2e-cli-gate` opt-in; milestone `Backlog / Triage` (an explicit, permitted milestone; promoting it to a release milestone is the owner's call). |
| Lock-slice disclosure | `PASS` — the PR body discloses the `proxy-addr` 2.0.7→2.0.8 lockfile repair and its audit rationale. Round-1 F5(a) is closed. I independently verified the lock edit: the recorded integrity equals npm's published `2.0.8` integrity exactly, frozen resolution still works, and `audit:critical` reports 0 critical. |
| PR DoD checklist complete | **`FAIL` — the one open item, by design.** CI `close-gate` is the single red check at `48aa35f`, failing on exactly one finding: *"unchecked PR body: #2081 line 24 [Definition of Done] \"Mandatory separate-session/different-family implementation evaluation is complete.\""*. That box is the artifact this evaluation produces; it was correctly left unticked rather than pre-claimed. |
| Release-gate class (rule 14) | `N/A` — not a release cut or release-gating run. |

CI at `48aa35f` / merge ref `4f62639`: `quality`, `check-test`, `build`, `code-quality`,
`fresh-ui-quality`, `scaffold-static`, `scaffold-runtime`, `scaffold-runtime-sqlite`,
`desktop-native-linux`, both visibility lanes and both classifiers — **all `success`**;
`surface-diff`, `deps-report`, `deploy`, `code-quality-repo`, `authorize`, `agent` policy-skipped;
**`close-gate` the only failure**, for the reason quoted above.

## Findings carried to closure

| Round-1 / round-2 finding | Status at `48aa35f` |
| ------------------------- | ------------------- |
| F1 checkpoint-staleness guard unbound | **closed** — bound at branch granularity (3 independent mutants) |
| F2 per-segment checkpoint cap unbound | **closed** — bound via the observed oldest-retained seek |
| F3 multi-chunk short-read integrity unbound | **closed** — patterned 3-window payload under 37-byte positioned reads |
| F4 "never fabricate resets" untested | **closed** — real denied-segment recovery with the unchanged-native reset as control |
| F5 AP-4 code + lock-slice disclosure | **closed** — debt `Reason` names AP-4/A11; disclosure verified in the PR body |
| F6 `scaffold.runtime` unproven | **closed** — off-worker exit 0, 104/104, verified from the immutable run and its artifact hash |
| F7 hook-shape guard | **closed as debt** — the `Cost` line now mandates re-running the native + RSS suites on any bump |
| F8 CI cost / OOM-sensitivity of the negative controls | **empirically retired** — required `check-test` is green on `ubuntu-latest` with the real 1 GiB fixture (5433/0/14, exit 0). Reasoned decline accepted. |
| F9 `main.ts` wiring untested; stray `proxy-addr-provenance.json` | informational — `main.ts` is now covered end-to-end by F6's runtime steps |
| R2-1 assertion diff diagnostics | reasoned decline accepted; optional future nicety |
| R2-2 / R2-3 off-worker head + durable receipt at head | **closed** — run re-dispatched at `48aa35f`; `review-quality-committed.json` PASS at that head |
| R2-4 forced final boundary unbound | informational — performance characteristic, not a claimed invariant |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Repairing a dependency's unbounded I/O without forking it | Per-call subclass overriding exactly the offending private methods, installed before construction, name-guarded fail-closed, asserted not to touch the upstream prototype, with offset equality against the unchanged dependency as the parity oracle | Archetype 5 service edges wrapping upstream servers | high |
| Memory claims need a process-level oracle | Subprocess fixture reading Linux `VmHWM`, a real ≥1 GiB fixture, an absolute ceiling fixed before measuring, and **both** old paths run as exit-1 negative controls | any memory/allocation regression | high |
| A test named after an invariant is not a lock on it | Mutation-probe each invariant — and each *branch* of a compound guard — before trusting a green suite; three documented invariants here survived total removal before the repair round | all harness runs | high |
| Prove a divergence from upstream with upstream as the control | The denied-segment test asserts both that the adapter preserves metadata and that the unchanged native store resets it, so the fixture cannot silently stop reaching the failure path | any local patch of dependency behaviour | high |
| An unprovable local gate is obtained off-worker, never downgraded | Record the local limitation, opt into the existing CI lane at the same head, then verify the run's own artifact hash rather than the summary | any environment-limited runtime gate | high |

## Verdict

| Field | Value |
| ----- | ----- |
| **Verdict** | **`PASS`** |
| Rationale | Approved scope is complete and the implementation is correct. Across three reviews of byte-identical production source I found no correctness defect in the bounded framing I/O, crash reconciliation, fork bases/caps/sub-offsets, arbitrary interior offsets, short reads, checkpoint bounds, or the server composition, and the adapter's three divergences from native are deliberate, documented and safer — including the elimination of a real destructive native offset reset. Every required static and fitness gate passes and was independently re-run by me at `48aa35f` (tests 18/0/0, check/lint/fmt 0, `quality:gate` 0, publish dry-run 0, `audit:critical` 0 critical). Runtime and consumer evidence is present and independently verified: the ≥1 GiB Linux RSS regression (native 2.20 GB / 2.21 GB exit 1 vs bounded 59.4 MB / 60.5 MB exit 0 against a 512 MiB ceiling, identical recovered offsets) and the full one-pass `scaffold.runtime` gate at exactly this head with **raw exit 0**, 104 passed / 0 failed / 0 skipped, confirmed from the immutable run, its unguarded command step, and an artifact I downloaded whose sha256 matches the tracked receipt. The local inability to run that gate stayed recorded and was never converted into a local pass. The only doctrine violation is AP-4, recorded as complete, justified debt with a removal gate and a filed upstream issue, so no `FAIL_DEBT` applies; the plan was sound throughout, so no `FAIL_RESCOPE` applies. Every round-1 and round-2 finding is closed, empirically retired, or an accepted reasoned decline, and no assertion or negative control was weakened to get there. |
| Required pre-merge bookkeeping (not re-evaluation) | `PASS` is the evaluation verdict, not a green close-gate. Before merge the supervisor must: (1) tick PR #2081's DoD box "Mandatory separate-session/different-family implementation evaluation is complete." and the "Independent evaluation and final evidence" slice box, citing this file and the phase comment; (2) replace the PR body paragraph that still calls the full runtime gate "unproven"/"exits 1 before scaffolding" with the verified off-worker evidence (run `37681694541`, job `112999350273`, exit 0, 104/104) while keeping the local-worker limitation stated as history; (3) move `status:impl-eval` → `status:ready-merge`; (4) re-run `close-gate` and confirm it is green. Optionally refresh the body's RSS table to the `rss-review-measurements.json` sample — both samples are valid measurements of the same fixture and ceiling. |
| Scope caveat to preserve in the merge record | F6 exercised the streams service on its **in-memory** branch (the generated project sets no `STREAMS_DATA_DIR`; the run's own output contains the service's non-durable warning). It proves the composition is non-regressive in a real runtime; the bounded durable path is proven by the native-store tests, the real-HTTP `dataDir` restart test and the ≥1 GiB RSS regression. Do not describe the E2E as durable-mode coverage. |
