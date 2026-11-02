## IMPL-EVAL S1 — issue 2591 · **FAIL_FIX**

**Session model observed:** `claude-opus-5` (Opus 5). Requested `claude-opus-5` @ xhigh — model matches; reasoning effort is not attestable from this session surface, so I don't claim it.

**Scope reviewed:** `.llm/runs/orch-divybot-6572256863--2591/{plan,worklog,research,context-pack,drift,supervisor}.md` + working diff (16 files). `profiles/` not read. No product source edited, nothing committed.

### What is correct (don't re-litigate)
- **The ordering race the issue is about is genuinely closed.** `watchSeedSample` arms `Deno.watchFs` (line 72) *before* the first `dispatchSeedSample` (line 77), so a publication can neither fall in the gap nor be double-dispatched. The seed writer's hard-link publication (`generate-database-seed.ts:38-54`) is atomic, so there is no partial-read window, and the `AlreadyExists` swallow keeps reseed identity stable — the doc's claim is accurate.
- Verified on Deno 2.9.7: `watcher.close()` during a suspended `for await` ends the iterator **cleanly**, and `using` double-close is safe. Not a defect.
- `Deno.realPath` normalization (line 70) correctly handles symlinked roots.
- Idempotency preserved: KV receipt + stable `scaffold-seed:<seedId>` key; `accepted` short-circuits before `job`/`enqueue`.
- The unhandled-rejection window (floating `seedWatch` rejecting before the race — I reproduced it killing the process at exit 1, bypassing `runChildHealthProcess`'s 1-second `failed` grace) is **already closed** by `void seedWatch?.catch(() => {})`.
- `--allow-write` is declared for the background child (`workers-contribution.ts:24-33`), so the new `Deno.mkdir` is permitted.
- **Public/local parity is complete**: option, `InstallPluginRequest.service`, `planPluginInstall` dependency, and shared `persistPluginMetadata` all line up; validation runs in planning, before writes, and the test proves `appsettings.json` is byte-identical.

### Findings

**F1 · HIGH · confirmed — a post-startup seed dispatch failure tears down the healthy worker.**
`plugins/workers/bin/runtime.ts` (`await Promise.race([worker.start(), seedWatch])`). Any rejection from a *watcher-driven* dispatch — transient Redis on `enqueue`, KV on `accepted`/`remember`, a republished malformed marker — rejects `seedWatch`, wins the race, and the `finally` stops worker **and** scheduler. I simulated the exact control flow with a failing `enqueue`: `STARTCOMBINED THREW: transient redis blip` / worker+scheduler stopped. Pre-change the seed path was one-shot and could not touch a running worker; this is a new failure mode where a *sample* handoff kills production worker runtime.
Fix — isolate the loop body; only the initial dispatch may fail startup:
```ts
await dispatchSeedSample(ports);                  // startup failure stays fatal
for await (const event of watcher) {
  if (signal.aborted) break;
  if (!event.paths.some((changed) => resolve(changed) === marker)) continue;
  try { await dispatchSeedSample(ports); }
  catch (error) { console.error('Seed sample dispatch failed; intent stays pending:', error); }
}
```
Then drop `seedWatch` from the **worker** race entirely (it can no longer reject post-startup).

**F2 · MEDIUM-HIGH · confirmed — `await seedWatch` in `finally` masks the real cause and can fail a clean shutdown.**
Same file, `finally { …; await seedWatch; }` with no catch. A dispatch rejecting while the watcher closes during an *orderly* stop makes `startCombinedProcess` reject → `run-child-health-process.ts:88-96` sets `Deno.exitCode = 1` and a `failed`/`crash-looping` terminal snapshot on a normal shutdown — exactly what the false-readiness/crash-loop negative controls exist to catch. It also replaces a genuine `worker.start()` error with a teardown-time seed error.
Fix: `await seedWatch?.catch(() => {});`, and bound it (`Promise.race` with a short delay) so an in-flight queue/KV call against a shutting-down Redis cannot hang the child's exit.

**F3 · MEDIUM · confirmed — `--service` edges accumulate and can never be moved or revoked.**
`kernel/adapters/plugin/plugin-reference-reconciler.ts:79`: `addConsumerReference` only adds; `pruneUninstalledReferences` only drops references to *uninstalled* plugins. Reproduced against the real reconciler: install `--service orders` → `Services.orders.PluginReferences = ['event-relay']`; reinstall `--service users` → **both** `orders` and `users` carry it. Explicit consumer *selection* that cannot be changed undercuts the feature and the new apiTable row. Pre-existing for `--app`, newly exposed by `--service`.
Fix: before `addConsumerReference`, revoke that `resourceConfigKey` from every `services`/`apps` entry not in the declaration's consumer set; add a regression test for the move case.

**F4 · MEDIUM · confirmed — `--service` unions with manifest consumers while `--app` replaces them.**
`plugin-app-references.ts:28` returns `[request.app]`; line 50 returns `[...declared, request.service]`. One CLI surface, two semantics, documented as neither. For a plugin that declares `linking.consumers.services`, `--service users` cannot narrow to `users`. Make `--service` replace (matching `--app` and the doc's "selects a plugin consumer"), or document the union and align `--app`. The new test only covers `declaredConsumers === undefined` — add the declared+explicit case.

**F5 · MEDIUM · confirmed — the documented ordered block is not runnable as written.**
`docs/site/orchestration-runtime/how-to/add-a-plugin.md:79-91`. (a) **`aspire restore` is missing**; `quickstart.vto:112-117`, `cli-reference.md:20-23,60`, `explanation/aspire.md:381` all restore first, and `cli-reference.md:23` names the exact error a reader hits without it. (b) `aspire start` blocks in an interactive terminal (`quickstart.vto:127` — "leave it open"), yet the block says "Run these commands in order" with `netscript db init` on the next line. The `--apphost … --non-interactive --nologo` form is the E2E/automation form (`e2e/.../typed-db-background-restart_test.ts:84-92`), not the human form.
Fix: add the restore step, and either split the block at `aspire start` with a "leave running / second terminal" note or state that this is the non-interactive form where `aspire start` detaches. The `<!-- documented-scaffold:* -->` markers have no consumer yet — if the S2 gate will execute this block, it must match exactly.

**F6 · LOW-MEDIUM · confirmed — the watcher goes silently deaf if `.netscript/` is removed and recreated.**
Probed on Linux: after removing the watched directory the iterator stays open forever and events in a recreated directory are never delivered. `remove-plugin.ts:253-263` prunes an empty `.netscript`, so remove-plugin → generate → seed with the child still up yields a live-but-dead watcher and no dispatch, silently. Fix: re-arm on a `remove` event matching the watched directory, or at minimum log once.

**F7 · LOW · confirmed — a test name claims more than it proves.**
`plugins/workers/tests/runtime/seed-sample_test.ts:46` — "without leaking a watch". Deno's sanitizers do **not** track `Deno.watchFs` (a deliberately leaked watcher passes a test cleanly), so the `using` cleanup on the throw path is unverified. Fix: after the rejection, publish into the marker directory again and assert `messages.length` is unchanged — or rename the test.

**F8 · LOW · simplification — `Promise.race([scheduler.start(), seedWatch])` can proceed with an unstarted scheduler.**
If `seedWatch` *resolves* first (pre-aborted signal), the race resolves and execution continues past scheduler startup; only the following `options.signal?.aborted` check saves it. Express the intent as rejection-only:
```ts
const seedFailure = seedWatch?.then(() => new Promise<never>(() => {})) ?? new Promise<never>(() => {});
await Promise.race([scheduler.start(), seedFailure]);
```

### Evidence I ran (read-only / focused)
- `deno test plugins/workers/tests/runtime/seed-sample_test.ts` → **7 passed**
- `deno test packages/cli/src/public/features/plugins/install/plugin-app-references_test.ts` → **4 passed**
- scoped `run-deno-check.ts`: install feature (20 files) and `plugins/workers/{src/runtime,bin}` (7 files) → **0 occurrences**
- scoped `run-deno-lint.ts` → **0 occurrences** (one batch refused `partial-exclusion` — tool quirk, not a lint failure)
- 5 Deno 2.9.7 probes (close-during-iteration, dir-removal, symlink paths, unhandled rejection with a live `Deno.serve`, sanitizer watcher tracking) + 1 reconciler drift repro + 1 control-flow simulation of F1
- **Explicitly not a finding:** root `deno fmt --check` flags the markdown file, but `deno.json` `fmt.include` is `ts`/`tsx` only, `fmt:check` passes `--ext ts,tsx`, and the baseline file was already unformatted. Per AGENTS.md this is not a package-quality verdict.

### Not certified (S2 scope — per brief, no gates asserted)
Documented runtime gate + both negative controls, `e2e:cli run scaffold.runtime`, carrier regeneration completeness, and end-to-end Activity/stream behavior. Docker is unavailable in this environment, so no runtime verdict is possible here and I do not self-certify final runtime evidence. Remains the evaluator session for subsequent rounds.
