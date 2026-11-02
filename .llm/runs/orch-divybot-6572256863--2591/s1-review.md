## IMPL-EVAL S1 (repair re-review) — issue 2591 · **PASS**

Same evaluator session, continuing from the earlier FAIL_FIX. Product source read-only; nothing committed. Session model observed: `claude-opus-5` — matches the matrix fallback recorded in the worklog; reasoning effort is not attestable from this session surface, so no effort claim.

### Prior findings — all closed, each verified independently

**F1 (late dispatch killing the worker) — closed.** `watchSeedSample` now splits startup from steady state: the initial `dispatchSeedSample` still propagates (so a malformed marker fails startup as before), while every event-driven dispatch goes through `dispatchPublishedSeed`, which catches and reports. `startCombinedProcess` no longer races the observer against `scheduler.start()`/`worker.start()` — both are direct awaits, and the observer promise is only ever observed via `.catch`. The failure mode I reproduced last round (a transient `enqueue` rejection tearing down a healthy worker) is now covered by a real-filesystem regression test that asserts the observer survives, `receipts.size === 0`, and the next publication succeeds.

**F2 (finally masking / hanging) — closed, probed.** I replicated the `finally` shape against `jsr:@std/async@^1`: with the observer rejected and `worker.start()` rejecting, `REAL worker failure` propagates (no masking); with the observer hung, it propagates at ~2000 ms and the process exits cleanly with no lingering timer. `deadline(seedWatch.catch(() => {}), 2_000).catch(...)` can neither rethrow nor stall shutdown.

**F3 (consumer edges accumulating) — closed, and keyed correctly.** The revocation map is keyed `rendered.plugin.serviceConfigKey ?? rendered.plugin.configKey`, which is the **identical expression** `persistPluginMetadata` uses to write `linking.resourceConfigKey`, so the key matches the reconciler's `declaration.resourceConfigKey` for any `--name` — this was my main residual risk and it holds by construction, not coincidence. Revocation is correctly scoped: only keys present in `previousServiceConsumers` and absent from the new declaration are dropped; `manual` links and other plugins' references survive, and the other three `reconcilePluginReferences` callers keep the no-revocation default.

**F4 (`--service` union vs `--app` replace) — closed.** `return [request.service]`. Validation before writes unchanged, and the test still asserts `appsettings.json` is byte-identical on the reject paths.

**F5 (documented block not runnable) — closed, verified against the real CLI.** `aspire restore --apphost … --non-interactive --nologo` is valid: `aspire restore --help` from the installed CLI lists all three options. The detach claim matches `quickstart.vto:127-131` and the e2e `start` form.

**F6 (watcher deaf after directory removal) — closed, and broader than claimed.** The re-arm keys on `kind === 'remove'` for the watched directory. I probed the near neighbour I was worried about: on Linux a directory **rename** also surfaces as `kind: 'remove'` with the directory path, so rename re-arms too. The re-arm test is well built — it watches the parent independently for the recreate rather than sleeping, and every wait is `Promise.race`d against the observer so a rejection can't hang it.

**F7 (overclaiming test name) — closed.** Renamed to "rejects malformed **startup** intent".

### Validation I ran this round (not relying on the supplied receipts)
- `deno test --allow-all --unstable-kv plugins/workers/tests/runtime packages/cli/src/public/features/plugins/install packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler_test.ts packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts` → **56 tests + 56 steps passed, 0 failed** (= the 112 TAP results in `s1-repair-tests.json`; the count reconciles).
- `run-deno-check.ts` over the 14 changed non-generated `.ts` files → **0 occurrences**.
- `check-doctrine.ts --all-roots` → **exit 0** (pre-existing warnings only); `check-root-coverage.ts` → `ok: true`; `scan-code-quality.ts --root packages --root plugins --root docs/site --max-allow 7` → **`ok: true`, 0 findings, allowCount 7 at the cap, no new allowances**. This matters because the supplied `s1-quality-receipt.json` predates the repair, and the repair touched a kernel adapter under doctrine — I re-ran it rather than inherit a stale receipt.
- `@std/async` confirmed already declared in `plugins/workers/deno.json`, so the new import does not break the publish surface.
- 2 new Deno 2.9.7 probes (directory-rename event kind; `deadline` masking/hang/exit behaviour).

### One evidence-accuracy correction for the handoff (not a code change)
`s1-repair-lint.json` and `s1-repair-fmt.json` report `filesProcessed: 14, droppedFiles: [], refusals: []`. Root `deno.json` excludes `packages/cli/` from **both** `lint` and `fmt`, and `packages/cli/deno.json` declares neither — `deno lint` on those paths returns "No target files found" and `deno fmt --check` on the same 14 files reports "Checked 3 files". So 11 of the 14 never linted or formatted; the three that did are the `plugins/workers` files, which are genuinely clean. The CLI's substance is covered by `quality:scan` + `check-doctrine` instead, both of which I ran green above. Fix the wording so the receipt isn't later cited as a lint/fmt verdict over CLI source — the same caution the worklog already applies to the fmt file selection.

### Residuals — non-blocking, for follow-up not S1
1. **`--app` still accumulates.** Selection semantics are now aligned (both replace), but revocation was implemented for `services` only; `addConsumerReference(apps, …)` is unchanged, so switching `--app a` → `--app b` still leaves `a`'s edge. The new doc paragraph correctly scopes the move claim to `--service` and says nothing false about `--app`. Pre-existing gap, now an asymmetry worth a tracked follow-up.
2. **No way to clear a consumer.** There is no `--no-service`; once set, reinstalls preserve it and only a different `--service` can move it. Parity with `--app`, and the docs state the preserve behaviour plainly.
3. **The initial dispatch has no timeout.** A wedged KV or queue blocks worker startup indefinitely between `dependenciesReady()` and `running`, surfacing as a readiness-probe failure rather than a fast structured failure. Same shape as before this slice, so not a regression — but S2's readiness assertions sit directly on it.
4. **A rejected observer stays dead and is only logged.** If `watchFs` fails during re-arm (e.g. inotify `ENOSPC`), later publications are never dispatched and nothing latches degraded health. Defensible — worker availability over sample dispatch — but undiscoverable from the health surface.
5. Cosmetic: `SEED_WATCH_SHUTDOWN_MS` is declared in the middle of the import block in `plugins/workers/bin/runtime.ts`. Lint and fmt are clean on it; move it below the imports when that file is next touched.

### Not certified
S2 clean documented-order runtime acceptance and its negative controls are not implemented and are **not** covered by this verdict. No runtime proof is claimed: Docker is unavailable in this environment, so the `scaffold.runtime` one-pass E2E, the Activity/stream end-to-end behaviour, and the final-head runtime CI remain unproven. `PASS` here means S1's watcher lifecycle, install consumer wiring, documented sequence, and focused test evidence hold on inspection and on the checks listed above — nothing more. This session remains the evaluator for S2 and should not be the session that produces the runtime evidence it will review.
