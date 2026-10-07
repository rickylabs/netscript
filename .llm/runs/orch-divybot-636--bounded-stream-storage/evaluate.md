# Evaluation: NetScript #2080 / harness #636 — bounded native durable-stream storage I/O

## Metadata

| Field          | Value                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Run ID         | `orch-divybot-636--bounded-stream-storage`                                                                          |
| Target         | `plugins/streams/services/src/**` (bounded native append-log I/O at the streams service seam)                        |
| Archetype      | `5 — Plugin Package` (service scope overlay; dependency-specific adapter, not a framework convention)                |
| Scope overlays | `service`                                                                                                           |
| Evaluator      | native Claude Opus 5 (`claude-opus-5`, xhigh), session `507f3317-ba68-4e62-b085-89eb707037de`, 2026-10-07            |
| Generator      | Codex `sol` (separate vendor family and session) — independence satisfied                                            |
| Heads reviewed | source content identical to commit `6aa1676` (sha256-pinned below); repo head at completion `c12a520`                |
| Phase          | IMPL-EVAL, feature tier, round 1                                                                                     |

Reviewed source identity (sha256, verified unchanged before and after every command in this pass, and
equal to the committed blobs — `git status --short plugins/ .llm/harness/` clean):

```
7b3c128c…f287c  plugins/streams/services/src/bounded-file-store.ts
3e488a97…7cbd7  plugins/streams/services/src/bounded-segment-log.ts
eea48a42…dbfbbb plugins/streams/services/src/main.ts
c519343e…79cb5aa plugins/streams/services/src/tests/bounded-file-store_test.ts
8bd815b9…6677d  plugins/streams/services/src/tests/bounded-segment-log_test.ts
14834a06…668f64 plugins/streams/services/src/tests/storage-rss_test.ts
c1b63c90…192aa  plugins/streams/services/src/tests/test_utils/storage-rss-worker.ts
```

Inputs read: `supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`,
`evaluator-prompt.md`, `evaluator-status-update.md`, `memory/*`, every `*.json`/`*.log` evidence file in
the run directory, `.llm/2026-10-07-bounded-stream-storage.md`, `.llm/harness/debt/arch-debt.md`,
`.llm/harness/evaluator/{protocol,verdict-definitions}.md`, the full diff of both implementation
commits, and the resolved dependency source
(`@durable-streams/server` 0.3.7 `src/{file-store,server,store,file-manager}.ts` + `dist/index.js`).

## Dependency ground truth (established independently, not from the run notes)

| Fact | Evidence |
| ---- | -------- |
| Resolved version is **0.3.7**, not 0.3.8 | `deno.lock` specifier `npm:@durable-streams/server@~0.3.7` → `0.3.7…`; `plugins/streams` `packageJson.dependencies`. The run corrected this in `research.md` + `drift.md` (initially claimed 0.3.8); conclusions are unaffected. |
| Exactly two full-file read sites exist | `grep readFileSync` over 0.3.7 `src/*.ts` → `file-store.ts:405` (`scanFileForTrueOffset`) and `file-store.ts:1564` (`readMessagesFromSegmentFile`). No other full-file/stream read path. |
| Both are plain prototype methods at runtime (not instance arrows) | `dist/index.js:1103`, `:1784` are method definitions on `FileBackedStreamStore = class { … }`; the adapter's runtime descriptor check validates this and fails closed. |
| Frame layout and offset accounting | 4-byte BE length + payload + 1 trailer byte; native advances `physicalDataOffset += messageLength + 5`, i.e. offsets are **frame-inclusive**. Recovery adds `forkOffset` base to the physical end (`file-store.ts:357-366`). |
| `dataDir` is used by the server only to choose the store | `grep dataDir dist/index.js` → `:3179` (store choice) and `:3185` (stored in `this.options`, never read again). So `super({…options, dataDir: undefined})` is behaviour-preserving apart from the store instance. |
| Segment paths are unique per stream incarnation and append-only | `generateUniqueDirectoryName()` = `encoded~base36(now)~8 hex random`; creation uses `fs.openSync(path, 'wx')`; deletion is `fs.rm(dir, {recursive})`. No in-place rewrite of an existing segment path. |
| The two hooks are byte-identical in 0.3.8 and 0.3.9 | `diff` of both method bodies 0.3.7 vs 0.3.9 → identical; so the committed `~0.3.7` range cannot silently change hook shape today. |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | `worklog.md`: `PLAN-EVAL: N/A` with justification, recorded in commit `7956710` **before** any implementation commit. Justification is sound: the issue supplies framing/offset/acceptance semantics and no public or storage contract is redesigned. |
| Design section exists in worklog | `PASS` | `## Design` (7 numbered items: public surface, vocabulary, ports, constants, commit slices, deferred scope, contributor path). |
| Commit slices match design plan | `PASS` | Slice 0 `7956710` (bootstrap/plan), slice 1 `6aa1676` (adapter + composition + tests + README + debt). Plus an out-of-plan CI repair slice `c12a520` (see F5). |
| Each slice has a passing gate | `PASS` | `quality-gate-committed.json` is a durable receipt at `gitHead == actualGitHead == 6aa1676`, `outcome PASS`, exit 0; `audit-critical-repair.json` PASS for the second slice. Pre-relocation `quality-gate.json` (head `7956710`) is superseded. |
| No speculative seams (unused files) | `PASS` | `SegmentFiles`/`SegmentFile` are the only injected port and are consumed by both the production `Deno` edge and the short-read/fault fixtures. No unused export: `SEGMENT_IO_BYTES`, `MAX_CACHED_SEGMENTS`, `MAX_SEGMENT_CHECKPOINTS`, `frameOffset`, `BoundedSegmentLog` are all referenced by production code or tests. |
| Constants used for finite vocabularies | `PASS` | `HEADER_BYTES`, `TRAILER_BYTES`, `SEGMENT_IO_BYTES`, `MAX_CACHED_SEGMENTS`, `MAX_SEGMENT_CHECKPOINTS`, `SCAN_HOOK`, `READ_HOOK`; the two hook names are named constants, not inline literals. |
| Agent briefs carry a `## SKILL` chapter | `PASS` | `evaluator-prompt.md` and `evaluator-status-update.md` both open with `## SKILL`. No other sub-agent brief exists in this run (the implementation agent is the supplied leaf). |
| Review-thread gate | `PASS` | `deno task check:review-threads -- --repo rickylabs/netscript --pr 2081 --pretty` exit 0, threads=0, unanswered=0 (`external-review.md`). The external Augment review on `6aa1676` is `COMMENTED` with no suggestions and explicitly did not re-run tests — it supplements, and does not substitute for, this evaluation. |

## Static Gates — independently re-run by the evaluator at the reviewed content

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Scoped typecheck | `run-deno-check.ts --root plugins/streams/services --ext ts --deno-arg --frozen` | `PASS` | 14 files, 1 batch, 0 failed batches, 0 occurrences, exit 0 (`deno check --unstable-kv --frozen`). Re-run after the lock repair: still exit 0. |
| Scoped lint | `run-deno-lint.ts --root plugins/streams/services --ext ts` | `PASS` | 14/14 processed, 0 occurrences, 0 refusals, exit 0. |
| Scoped format | `run-deno-fmt.ts --root plugins/streams/services --ext ts` | `PASS` | 14 selected / 14 processed, 0 findings, 0 dropped, exit 0. |
| Scoped tests | `run-deno-test.ts -- --allow-all --frozen plugins/streams/services/src` | `PASS` | 17 passed / 0 failed / 0 ignored, exit 0, 4.0 s. Matches the run's `tests.json`. |
| Doc lint (changed export) | `service-doc-lint.json` + inspection | `PASS` | `./services/src/main.ts` → 0 errors / 0 private-type refs / 0 missing JSDoc. |
| Doc lint (whole plugin) | `doc-lint.log` | `FAIL (pre-existing)` | exit 1 from `./mod.ts` (`packages/plugin/src/config/domain/plugin-contributions.ts` private type) and `./src/cli/composition/main.ts` (2 missing JSDoc). Neither file is touched by this branch; `git status` confirms. Correctly reported as baseline, not claimed green. |
| Publish dry-run | `cd plugins/streams && deno publish --dry-run --allow-dirty` | `PASS` | `Success Dry run complete`, exit 0. Published file list contains `services/src/bounded-file-store.ts` and `bounded-segment-log.ts` and **no** `tests/` or `test_utils/` file — the `**/*_test.ts` + `**/test_utils/**` excludes cover the new layout, confirming the worklog claim. |
| JSR structural audit | `jsr-audit.log` vs `jsr-audit-initial.log` | `PASS` | Final run: 1 finding (pre-existing `F-JSR-7` slow-types warning, present in the initial run too). The initial `F-DOCT-5` cardinality finding (`services/src` 14 children > 12) was resolved by moving tests to `services/src/tests/`. `surface: ./services=0` → the adapter adds **zero** public symbols. |
| Lock hygiene | `git status --short deno.lock` after every evaluator command | `PASS` | Clean. No evaluator-induced churn; `--frozen`/`--no-lock` used throughout. |

## Fitness Gates

Authority for the F-codes is the repo's own checker, which I re-ran at the reviewed content:
`deno task quality:gate` → **exit 0**, and the `streams` doctrine section is `FAIL=0 WARN=5 INFO=1`
with every warning pre-existing (README code fences, four `export default` stubs). The pre-change
`F-16` `services/src` cardinality warning is gone. The generator's durable receipt
`quality-gate-committed.json` reproduces this at `6aa1676`.

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| F-1 file size | `PASS` | 85 / 185 production lines (caps 300/500); no new `A8` warning. |
| F-2 helper reinvention | `PASS` | Wraps `Deno.openSync`/`seekSync`/`readSync`/`statSync` + `DataView`; no re-implementation of a platform primitive. |
| F-3 layering | `PASS` | Service-local adapter; no package/plugin boundary crossed. |
| F-4 inheritance audit | `DEBT_ACCEPTED` | Two upstream subclasses — see AP-4 and `STREAMS-BOUNDED-NATIVE-IO-HOOKS`. Depth is 2 (upstream `FileBackedStreamStore` extends nothing), so no new `A5` 3+-level warning. |
| F-5 public surface | `PASS` | `./services` export surface remains 0 symbols; no export-map change. |
| F-6 JSR publishability | `PASS` | Publish dry-run exit 0; no new slow types. |
| F-7 doc score | `PASS` | Module JSDoc on all three files; every exported symbol and interface member documented. |
| F-8 workspace `lib` override | `N/A` | No `compilerOptions.lib` change. |
| F-9 permission declaration | `PASS` | `Deno.openSync(path,{read:true})` needs only `--allow-read`, already required by the native `node:fs` path and present in the plugin `start`/`dev` tasks. |
| F-10 test shape | `PASS` with gaps | Behaviour-level tests against the real native store, real HTTP, and a real 1 GiB log; no snapshot blobs. Specific regression-lock gaps are findings F1–F4. |
| F-11 forbidden folders | `PASS` | `tests/` + `test_utils/` are established repo conventions (`packages/*/tests` exist); checker raises nothing. |
| F-12 naming | `PASS` | No `IFoo`/`FooT`; file names kebab-case. |
| F-13 saga/runtime invariants | `N/A` | Not a saga/worker surface. |
| F-14 console-log lint | `PASS` | Production adapter has no `console.*`. `storage-rss-worker.ts` prints its measurement but is publish-excluded test tooling. |
| F-15 re-export of upstream | `PASS` | No upstream symbol is re-exported; upstream types appear only in local function signatures of non-exported modules. |
| F-16 folder cardinality | `PASS` | `services/src` back to 11 immediate children (was 14 before the relocation). |
| F-17 abstract-derived co-location | `N/A` | No local abstract base. |
| F-18 sub-barrel | `PASS` | No new barrel. |
| F-19 scoped source gate runners | `PASS` | All evidence produced through `.llm/tools/run-deno-*.ts` and `.llm/tools/gates/run-gate.ts`. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Native store semantics on real LMDB + real segments | `tests/bounded-file-store_test.ts` (3 tests) | `PASS` | Reproduced: 3/3, exit 0. Covers crash-torn trailing frame, metadata-ahead truncation (only two header bytes surviving), fork + chained fork, JSON `formatResponse`, fork sub-offset, producer epoch/closed state across a real restart. |
| Real server composition over HTTP | `tests/bounded-file-store_test.ts` seam test | `PASS` | `PUT`→201, `POST`→204, `server.stop()`, re-create, tail read at the returned offset → `after`, `offset=-1` → `beforeafter`. Also asserts `FileBackedStreamStore.prototype` descriptors for both hooks are **identical before and after**, i.e. no global prototype mutation. |
| ≥1 GiB Linux RSS ceiling with native negative controls | `tests/storage-rss_test.ts` | `PASS` | **Independently reproduced** by the evaluator (`NETSCRIPT_STORAGE_RSS_REPORT=…`): log 1,073,746,944 B (real, fully framed, asserted ≥ 1 GiB and `== FRAME_COUNT*FRAME_BYTES`); ceiling 536,870,912 B. `old-recovery` recovery peak **2,202,918,912** (exit 1); `old-tail` (unchanged native read via `Reflect.apply` on the recovered store) peak **2,205,159,424** with recovery peak 58,748,928 (exit 1); `bounded` recovery 58,740,736 / after-tail **59,817,984** (exit 0). All three report the **same** recovered offset `0000000000000000_0000001073746944`. |
| Full CLI E2E `scaffold.runtime` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | `NOT_RUN (environment)` | `scaffold-runtime.log`: `preflight.deno` PASSED, `preflight.aspire` FAILED before any scaffold step; `aspire-doctor.json` → `dotnet-sdk: fail (.NET SDK not found)`; Docker daemon socket unreachable, so cleanup also failed. No AppHost/container was started. Correctly recorded as **UNPROVEN**, never green. Honest and not bypassed — but still missing required runtime evidence for a service-runtime change (F6). |
| Resource hygiene | `deno task maint:leak-check` | `PASS` | `leak-check.log` exit 0; `leak-report.md` lists only foreign `deploy-85d15ee` AppHost/DCP processes with `ownership: unproven`, none mutated. Correct behaviour per the hygiene rules. |
| Dependency audit (second slice) | `deno task audit:critical` | `PASS` | Re-run by the evaluator: `0 critical` (38 total: 3 low / 17 moderate / 18 high), exit 0; matches `audit-critical-repair.json`. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| `plugins/streams` service entrypoint | `main.ts` composes `createStreamsServer` instead of `new DurableStreamTestServer` | `PASS` | 2-line diff; `createStreamsServer(options)` returns the plain native server when `dataDir` is falsy (identical to native `if (options.dataDir)`), so in-memory development behaviour is untouched. |
| Published JSR surface | export map + publish dry-run | `PASS` | `exports` unchanged; `./services` still 0 public symbols; adapter shipped as internal module only. |
| Generated userland / Aspire | `scaffold.runtime` | `NOT_RUN` | See runtime gates; no scaffold or Aspire template changed by this branch. |
| Storage format compatibility | byte-level review + restart tests | `PASS` | No write path touched. Append, metadata, LMDB schema, segment naming, trailer byte and offset strings are untouched; `frameOffset()` reproduces the native 16+1+16 format exactly. Pre-existing data directories recover to the identical offsets (proved on the 1 GiB fixture and in the restart tests). |

## Semantic review — bounded reader vs. unchanged native behaviour

I compared the adapter line-by-line against 0.3.7 `readMessagesFromSegmentFile` /
`scanFileForTrueOffset` and derived the inclusion predicates:

| Behaviour | Native | Adapter | Verdict |
| --------- | ------ | ------- | ------- |
| Frame end | `filePos + 4 + len + 1`, offset advances by `len + 5` | `position + HEADER_BYTES + length + TRAILER_BYTES` | identical (frame-inclusive) |
| Message included | `baseByteOffset + physicalEnd > startByte` | `end > max(0, startByte - base)` ⇔ `base + end > startByte` | identical, including `startByte < base` and negative `startByte` |
| Cap | break when `base + end > capByte` | break when `end > min(size, capByte - base)` | identical; `capByte < base` ⇒ `[]` in both |
| Fork base/cap plumbing | computed by native `read`/`readForkedMessages`/`resolveForkSubOffset` | untouched — the hook only receives `(path, startByte, base, cap?)` | fork bases/caps cannot be corrupted by the adapter |
| Missing segment | `existsSync` → `[]` | `Deno.errors.NotFound` → `[]` | identical |
| Incomplete trailing header/payload | stop | stop | identical |
| Recovery offset | last complete frame end | last complete frame end | identical (verified bit-exactly on the 1 GiB fixture and the truncation tests) |
| Corrupt length (`0xFFFFFFFF`) | `frameEnd > length` ⇒ stop, offset 0 | `end > size` ⇒ stop, offset 0, **no allocation attempt** | identical result; adapter additionally cannot allocate a 4 GiB buffer because it validates `end ≤ size` before reading any payload |
| Payload complete but trailer byte missing | native `read` **returns** the frame (it increments past EOF without a bound check) while native `scan` excludes it | adapter excludes it in both | **deliberate divergence, safer**: native `read` could emit a frame beyond the offset that recovery reconciled to. Only reachable on a torn tail write. |
| I/O error mid-read | `catch` → returns messages accumulated so far (silent truncation) | throws (only `NotFound` → `[]`) | **deliberate divergence, documented in code**: a loud failure instead of silent data loss. Changes the failure mode to a 5xx under e.g. `EACCES`/`EMFILE`. |
| Scan error (unreadable segment) | `catch` → returns offset `0`, and `recover()` then **writes that reset into LMDB** | throws → caught by native `recover()`'s per-stream `try/catch` → `errors++`, metadata untouched | **deliberate divergence, satisfies the owner's "never fabricate resets"** |

I verified the last row empirically rather than by reading. Isolated probe (temp dir, `chmod 000` on
the segment, then reconstruct each store):

```
{ "good": "0000000000000000_0000000000000008",
  "boundedAfter": "0000000000000000_0000000000000008",   // bounded store preserves the offset
  "nativeAfter":  "0000000000000000_0000000000000000",   // unchanged native store resets LMDB to 0
  "afterRestore": "0000000000000000_0000000000000008" }  // self-heals once readable again
```

Native's log line is explicit: `Recovery: Offset mismatch for /s: LMDB says …_8, file says …_0.
Reconciling to file.` The repair therefore removes a real, destructive native reset. This is the one
owner-named constraint with **no** test of its own (finding F4).

Correctness details I checked and found sound:

- **Hook installation ordering.** The descriptors are installed on a *fresh per-call* subclass
  prototype **before** `new BoundedStore({dataDir})`, so the native constructor's `recover()` already
  runs through the bounded scan. `createBoundedFileBackedStreamStore` creates its own class and its
  own `BoundedSegmentLog` per call — no cross-instance or cross-process state.
- **No global mutation.** `Object.defineProperties(BoundedStore.prototype, …)` touches only the local
  subclass; `FileBackedStreamStore.prototype` is untouched (asserted by the seam test, and I verified
  the descriptor identity logic myself).
- **Fail-closed guard.** Both hook names are verified as own prototype function descriptors before
  any subclass is built; a renamed/relocated hook throws `Unsupported durable-streams storage API: …`
  at service construction rather than silently reverting to full-file reads.
- **`store` override.** `override readonly store` is re-assigned immediately after `super()`, so the
  class-field define semantics cannot leave it `undefined`; `start()` reads `this.store` later
  (`SubscriptionManager`), `stop()` matches `instanceof FileBackedStreamStore` (the subclass passes)
  and `'cancelAllWaits' in this.store` still holds. The discarded in-memory `StreamStore` has no
  constructor, timers or handles.
- **Boundary cache soundness.** `remember()` only records positions reached by complete-frame
  traversal and only strictly increasing ones, so `positions` is always an ascending list of verified
  boundaries; the seek picks `max{checkpoint ≤ physicalStart}`, which can never skip a message because
  every frame ending at or before `physicalStart` is excluded by the inclusion predicate anyway. The
  final forced `remember` is always a real boundary (loop exits only on a complete frame, an
  incomplete header, or the cap).
- **Bounded memory.** One reusable 64 KiB window per call (`FrameCursor` is per-call, so concurrent
  requests cannot share it — and `read`/`scan` are fully synchronous, so they cannot interleave inside
  one isolate); payload allocation is exactly the requested complete messages; the cache is
  `≤ 32 paths × ≤ 128 numbers`. Cold historical offsets traverse framing headers but never allocate
  skipped payloads — exactly the stated contract.
- **Short reads.** `readExactly` loops on `readAt`, advances by the returned count, and treats `0`
  (and an impossible over-read) as a hard error; `payload()` chunks at 64 KiB. `size` is snapshotted
  at open, so a concurrent append cannot extend a read.
- **Checkpoint staleness.** Invalidation on file-identity change (`dev:ino:birthtime` — `birthtime` is
  present on this Linux, confirmed), on shrink, and on equal-size-with-changed-mtime. The one
  theoretical escape (same inode+birthtime, rewritten in place, growing past the previously observed
  size) is **unreachable through this dependency**: segment names are unique per incarnation
  (`encoded~ts~random`) and created with `wx`, and deletion removes the directory. So the guard is
  defence-in-depth, which is exactly why it needs a test (F1).
- **No fabricated resets, no prototype mutation, no history allocation for a recent tail** — all three
  owner prohibitions hold.

I found **no substantive correctness defect** in the implementation.

## Mutation probing — do the tests actually fail under the old/wrong behaviour?

Because "the tests pass" is not evidence that the tests *bind*, I copied the module and its suite into
`$TMPDIR` (repo untouched) and ran 10 targeted mutations.

| # | Mutation (reverting to an old/wrong behaviour) | Suite result |
| - | --------------------------------------------- | ------------ |
| M1 | frame offsets exclude the trailer byte | **caught** — 5/6 fail |
| M2 | seek straight to the requested offset (treat it as a boundary) | **caught** — 3/6 fail |
| M3 | remove **all** checkpoint invalidation (identity / shrink / mtime) | **NOT caught** — 6/6 pass |
| M4 | `readExactly` accepts a partial fill (no short-read loop) | **weakly caught** — only the zero-read fault test fails |
| M5 | remove the `MAX_SEGMENT_CHECKPOINTS` bound | **NOT caught** — 6/6 pass |
| M6 | remove `MAX_CACHED_SEGMENTS` eviction | **caught** |
| M7 | fork cap not rebased (`capByte` instead of `capByte - base`) | **caught** |
| M8 | payload read starts at the frame start instead of after the header | **caught** — 4/6 fail |
| M9 | start comparison `>=` instead of `>` | **caught** |
| M10 | drop the forced final boundary checkpoint in `scan` | **NOT caught** — 6/6 pass |

Plus the suite-level negative controls, which are genuine: the RSS test asserts `exit == 1` **and**
`recoveryPeakRss > ceiling` for the unchanged native recovery, `peakRss > ceiling` for the unchanged
native read, and offset equality between bounded and native recovery. So the headline claims
(frame-inclusive offsets, non-boundary arbitrary offsets, fork caps, payload framing, bounded memory on
a real 1 GiB log, no global prototype mutation) are properly locked. The gaps are the bounded-cache
invariants (M3, M5) and multi-chunk short-read integrity (M4), which the module documents as
invariants but no assertion pins.

## Anti-Pattern Check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-1 monolithic file | `CLEAR` | 85 / 185 lines. |
| AP-2 helper renaming a primitive | `CLEAR` | `SegmentFile` adds a size snapshot + identity, not a rename of `Deno.FsFile`. |
| AP-3 god interface | `CLEAR` | `SegmentFiles` has one method; `SegmentFile` has 3 members + 3 fields, all used. |
| AP-4 cross-package implementation inheritance | `DEBT_ACCEPTED` | `BoundedStore extends FileBackedStreamStore`, `BoundedServer extends DurableStreamTestServer`. Recorded as `STREAMS-BOUNDED-NATIVE-IO-HOOKS`; the entry names `A11` but **not** `AP-4` (finding F5). |
| AP-5 multi-level base lattice | `CLEAR` | Depth 2; upstream base extends nothing. |
| AP-6 base class with concrete methods | `CLEAR` | No local base class is introduced. |
| AP-7 telescoping factory | `CLEAR` | `createStreamsServer(options)` / `createBoundedFileBackedStreamStore(dataDir)`. |
| AP-8 premature DI container | `CLEAR` | One narrow port, injected positionally. |
| AP-9 premature abstraction | `CLEAR` | The port exists because the fault/short-read fixtures need it. |
| AP-10 defensive try/catch in handlers | `CLEAR` | One `catch` narrowed to `Deno.errors.NotFound` for documented native parity; everything else rethrows. `try/finally` is for descriptor close. |
| AP-11 hidden globals | `CLEAR` | Cache is per-store-instance; no module-level mutable state; upstream prototype untouched (test-asserted). |
| AP-12 `Date.now()`/`setTimeout` in handlers | `CLEAR` | None in the adapter (`timestamp: 0` matches native). |
| AP-13 `console.log` in published code | `CLEAR` | Only in the publish-excluded RSS worker. |
| AP-14 re-exporting upstream | `CLEAR` | No upstream re-export. |
| AP-15 `IFoo`/`FooT` | `CLEAR` | — |
| AP-16 `utils/`/`helpers/`/`lib/` folders | `CLEAR` | `tests/`, `test_utils/` — repo-conventional, checker-clean. |
| AP-17 `interfaces/` folder | `CLEAR` | — |
| AP-18 giant snapshot tests | `CLEAR` | Fixtures are generated, assertions are structural. |
| AP-19 permissions assumed silently | `CLEAR` | Read-only `Deno` file APIs; same permission as the native `node:fs` path. |
| AP-20 workspace `lib` override | `N/A` | — |
| AP-21 flat command surface | `N/A` | — |
| AP-22 useless re-export barrel | `CLEAR` | — |
| AP-23 inline command body in composition | `CLEAR` | `main.ts` delegates to the factory. |
| AP-24 switch over tagged union | `CLEAR` | — |
| AP-25 side effect in non-edge file | `CLEAR` | Both new modules are side-effect free; `main.ts` remains the only edge. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 1 | `STREAMS-BOUNDED-NATIVE-IO-HOOKS` — has ID, Reason, Owner, Target (upstream `durable-streams/durable-streams#420`), Linked plan, Created, Status (`open, DEBT_ACCEPTED`), Gate (removal requires complete-frame + fork/cap/sub-offset + restart/producer + ≥1 GiB RSS parity at the same ceiling), Cost. Matches the registry's field conventions. |
| Resolved entries | 0 | — |
| Deepened violations | 0 | No existing entry is deepened. |
| Unrecorded violations | 0 | AP-4 is recorded (though not by code — F5). |

**Is the two-hook adapter reasonable until upstream offers a seam?** Yes. The defect lives inside two
`private` methods of a class whose constructor performs recovery, and the public constructor offers no
store injection, so composition/delegation cannot intercept it and a global prototype patch would
change behaviour for every consumer in the process. A per-call subclass that overrides exactly two
methods, installed before construction, guarded by a runtime shape check, asserted not to touch the
upstream prototype, and verified against the unchanged native store for offset equality on a real
1 GiB log is the smallest viable blast radius. It is tracked with a concrete removal gate and an
upstream issue. The residual risk is a *silent signature/semantic* change inside those methods on a
dependency bump; today's range is safe (hooks byte-identical in 0.3.7/0.3.8/0.3.9), and F7 proposes a
cheap arity assertion.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium | **F1 — the checkpoint-staleness guard has no regression lock.** Deleting every invalidation branch in `recent()` leaves the whole suite green, although the test that claims to cover it is named "append, truncation and replacement invalidate stale boundaries". It passes because the stale checkpoints in that fixture all sit *above* the requested start offset (tiny frames ⇒ only the forced final boundary is ever recorded), so the seek lands on 0 either way. Since the guard is unreachable through the current upstream, tests are its only verification. | mutation M3: 6/6 pass | fix — add a case where a stale boundary sits **at or below** the requested start and is no longer a frame boundary: write ≥2 frames of ≥`SEGMENT_IO_BYTES` so mid-file checkpoints are recorded, then replace the content with a **same-size, differently framed** body and bump `modified`, and read from an offset above the first stale checkpoint. Correct code invalidates and parses; M3-style code misparses. |
| medium | **F2 — the per-segment checkpoint cap is documented but unasserted.** Removing `if (entry.positions.length > MAX_SEGMENT_CHECKPOINTS) entry.positions.shift()` keeps the suite green, yet "fixed upper bound on verified frame boundaries retained per segment" is an invariant stated in the module JSDoc, the README and the debt entry. The 1 GiB RSS test cannot catch it (≈16 k numbers ≈ 128 KB), so the bound is unprotected and would only bite on a much larger log. | mutation M5: 6/6 pass | fix — the tail-seek test already builds `MAX_SEGMENT_CHECKPOINTS + 16` large frames; assert the retained boundary count (or expose/observe it) instead of only the read-byte bound. |
| medium | **F3 — multi-chunk short-read integrity is unasserted.** `readExactly`'s loop is the only thing standing between a partial `readSync` and silently truncated payloads, but no test compares a payload larger than the fixture's `maxRead`. With the loop defeated, 5/6 tests still pass; only the zero-read fault case fails. The "short reads" fixture (`maxRead = 37`) happens to exercise only reads that complete in one call or whose bytes are never compared. | mutation M4: 5/6 pass | fix — in the short-read fixture, read back a payload spanning several `SEGMENT_IO_BYTES` chunks with a small `maxRead` and `assertEquals` the whole byte array (and the scan offset). |
| medium | **F4 — the owner's "never fabricate resets" guarantee has no test.** The adapter's most valuable behavioural improvement (an unreadable segment leaves LMDB metadata intact, where the unchanged native store reconciles `currentOffset` to zero) is proved only by my ad-hoc probe. A regression that re-added a `catch { return frameOffset(0) }` would be invisible to the suite. | evaluator probe above (`nativeAfter` = `…_0`, `boundedAfter` = `…_8`); only `tests/bounded-segment-log_test.ts` covers the throw at log level | fix — one store-level test: create+append, `close`, `Deno.chmod(segment, 0o000)`, reconstruct the bounded store, assert `getCurrentOffset` is unchanged (and optionally that native resets it), then restore the mode. Cheap and directly pins the owner's constraint. |
| low | **F5 — out-of-plan second slice and an AP-code gap.** (a) Commit `c12a520` changes `deno.lock` (`proxy-addr` 2.0.7→2.0.8) in a PR whose approved scope is bounded stream storage; the supervisor's original contract said "No … lock churn is committed". It is owner-alert-driven, recorded as drift with an explicit supervisor scope extension, minimal (one version key + integrity, transitive via `@tanstack/ai-mcp → @modelcontextprotocol/sdk → express`), and I verified the integrity matches npm's published `2.0.8` integrity exactly, that `--frozen` resolution still works, and that `audit:critical` is 0-critical. Acceptable, but it must be visible in the PR body/slice comment so a reviewer is not surprised by a `fix(deps)` commit. (b) The debt entry labels the coupling `A11` only; the registry's reference-trust note expects current `AP`/`F` codes, and the precise code here is `AP-4`. | `git show c12a520`; `audit-critical-repair.json`; local npm registry metadata; `arch-debt.md` heading | fix (documentation) — name `AP-4` in the debt entry and surface the dependency slice in the PR body. |
| low | **F6 — required runtime gate unproven, with an available path to prove it.** `scaffold.runtime` cannot run on this worker (no .NET SDK, no Docker daemon) and the run says so honestly. But the change *is* in the streams service runtime that this suite exercises, so the gate is substantively relevant rather than `n/a`. The repo already provides an escape hatch (the OpenHands PR-trigger template in `AGENTS.md`, or the `e2e-cli` CI workflow). | `scaffold-runtime.log`, `aspire-doctor.json` | fix (evidence) — obtain the gate off-worker (OpenHands trigger or CI `e2e-cli`) and attach the raw exit code, or get an explicit owner waiver recorded in the run. Do not re-attempt locally. |
| low | **F7 — hook guard checks names, not shapes.** The guard proves the two names are own prototype functions but not their arity/semantics, so a future upstream release that keeps the names and changes the contract would pass the guard and diverge silently. Today's risk is nil (hooks byte-identical across 0.3.7–0.3.9) and the integration tests would catch semantic drift *if* run on the new version. | `bounded-file-store.ts:41-48`; cross-version `diff` | optional hardening — assert `hook.length` (1 and 4) alongside the name check, and note in the debt `Cost` line that a bump must re-run the native integration + RSS suites. |
| low | **F8 — CI cost/robustness of the 1 GiB regression.** `plugins/*` is a workspace member, so the required repo-wide `check-test` job now writes a ~1 GiB fixture and deliberately drives a child process to ~3.3 GB peak RSS on every run. `assertEquals(oldRecovery.code, 1)` treats any other exit as failure, so an OOM-kill (137) on a smaller runner turns the *negative control* into a red build for an environmental reason (`ubuntu-latest`'s 16 GB is fine today). ~1.1 GiB of free `$TMPDIR` is also now a hard requirement. | `.github/workflows/ci.yml` `check-test` → `deno task test`; root `workspace: [… plugins/* …]`; measured peaks | optional — accept "non-zero exit **or** signal" as proof the native path blew the ceiling, and/or gate the controls on detected memory/disk headroom; document the temp-space requirement next to the ceiling constant. |
| info | **F9 — `main.ts` wiring is only type-checked, never executed by a test.** `main_test.ts` boots a *stand-in* upstream (pre-existing pattern), so reverting `createStreamsServer` → `new DurableStreamTestServer` in `main.ts` would not fail any test; the seam test covers the factory, not its adoption. Also, the run directory contains `proxy-addr-provenance.json`, which is unexplained outside the dependency slice. | `main_test.ts:26-40`; `tests/bounded-file-store_test.ts:106` | none required — note for future slices. |

Pending vs. substantive: F1–F4 are substantive test-completeness defects in the submitted work.
F6 is pending external evidence, not a code defect. The whole-plugin doc-lint failure and the
Aspire/Docker absence are pre-existing / environment-only and were reported as such.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Repairing a dependency's unbounded I/O without forking it | Per-call subclass overriding exactly the offending private methods, installed before construction, name-guarded fail-closed, asserted not to touch the upstream prototype, with offset equality against the unchanged dependency as the parity oracle | Archetype 5 service edges wrapping upstream servers | high |
| Memory claims need a process-level oracle, not a unit assertion | Subprocess fixture reading Linux `VmHWM`, a real ≥1 GiB fixture, an absolute ceiling fixed before measuring, and **both** old paths run as exit-1 negative controls | any memory/allocation regression | high |
| A test named after an invariant is not a lock on it | Mutation-probe the invariant before trusting the suite: three documented invariants here survive total removal of their implementation | all harness runs | high |
| Arbitrary byte offsets in a framed log are not frame boundaries | Seek only to verified boundaries from a fixed-capacity cache; accept cold header traversal rather than a blind seek | append-log/segment readers | high |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `FAIL_FIX` |
| Rationale | The plan is valid and the implementation is substantively correct: I found **no** correctness defect in the bounded framing I/O, crash reconciliation, fork bases/caps, arbitrary-offset handling, short-read loop, checkpoint bounds, or the server composition, and I independently reproduced every scoped gate (check/lint/fmt/tests 17-0, `quality:gate` exit 0, publish dry-run exit 0, `audit:critical` 0-critical) plus the ≥1 GiB Linux RSS regression (native 2.20 GB / 2.21 GB vs bounded 58.7 MB against a 512 MiB ceiling, identical recovered offsets). Mutation probing confirms the headline behaviours are genuinely locked. `FAIL_FIX` is scoped to evidence completeness, not to the design: three documented invariants (checkpoint invalidation F1, per-segment checkpoint cap F2, multi-chunk short-read integrity F3) and the owner's explicit "never fabricate resets" guarantee (F4) survive full removal of their implementations with a green suite, so they are claims without regression locks; the required `scaffold.runtime` runtime gate is still unproven and should be obtained off-worker or waived (F6); and the out-of-plan lock slice plus the missing `AP-4` reference need to be surfaced (F5). All are small, additive fixes. Re-steer this same session once F1–F4 land and F5–F6 are addressed. |
