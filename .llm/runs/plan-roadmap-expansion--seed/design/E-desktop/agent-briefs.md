# Topic E — per-slice WSL Codex agent briefs (DRAFT — for post-ratification implementation)

Lane law (mission §Delegation): framework/plugin implementation = **WSL Codex** daemon-attached
slices; **separate-session OpenHands IMPL-EVAL** (qwen 3.7 max) per slice; Claude supervises only.
Each slice: own branch/worktree, commit → push → PR comment → append `commits.md` before the next.
None of these run until the owner ratifies the roadmap.

**Global validation reminders (all slices):** `--unstable-kv` on targeted `deno check`; use the
scoped wrappers (`.llm/tools/run-deno-{check,lint,fmt}.ts --root <pkg> --ext ts,tsx`) not raw root
CLI; wrap `deno task` in `rtk proxy`; `deno doc --lint` is the public-surface bar for any package
export change.

---

## Brief #E1 — sdk in-process link-mode adapter

- **Model/effort:** GPT-5 Codex, **high** (public API + type-soundness seam; wire-parity is subtle).
- **Worktree:** dedicated WSL worktree off `origin/main`; explicit refspec push (WSL upstream-tracking
  landmine — push `HEAD:refs/heads/<branch>`).
- **## SKILL:** `netscript-doctrine` (ARCHETYPE for `@netscript/sdk` package surface; A1
  public-types-first, A7 wrap-don't-reinvent), `netscript-deno-toolchain` (`deno doc`/`deno doc
  --lint`, JSR export map), `netscript-harness` (slice/commit discipline), `netscript-pr` (branch/PR/
  closing-keyword — no keyword here; references #327/#E1), `netscript-tools` (scoped wrappers, lock
  hygiene).
- **Task:** implement `createInProcessClientLink`, in-process registry, `ServiceClientTransport`
  switch, `createInProcessServiceClient`; wire into `createServiceClient` (default stays `http`).
  Reuse oRPC `RPCLink` — substitute only the `fetch` transport; identical `apiPath/version/segment`
  pathname. Resolve the sdk↔service `ServiceApp` type-dependency direction (O-1) and record it.
- **Anti-divergence test (load-bearing):** one built service, assert HTTP-client and in-process-client
  outputs are byte-identical for a representative contract; assert W3C trace headers reach the app.
- **Do NOT:** hand-roll `ClientLinkPort.call`/an RPC codec; leak oRPC/Hono types into public
  signatures; change HTTP behavior.
- **IMPL-EVAL note:** OpenHands qwen 3.7 max, separate session. Gate on: parity test green, back-compat
  (existing sdk tests green), `deno doc --lint` clean, no new `any`. This slice needs **no** e2e; it is
  headless-unit-testable — call that out so the evaluator doesn't demand `scaffold.runtime`.

## Brief #E2 — desktop app-type in the Aspire generator (folds #375)

- **Model/effort:** GPT-5 Codex, **medium** (mirrors existing `app`/`tauri`/`task` branches; a
  well-evidenced generator addition).
- **## SKILL:** `netscript-cli` (scaffold/generator command work — canonical), `aspire` (`addExecutable`,
  service-discovery env, `WithCommand` surface, 13.4.6 pin), `netscript-doctrine` (generator output
  = typesafe codegen, no string-template drift), `netscript-harness`, `netscript-pr` (**`Closes
  #375`** in the PR body), `netscript-tools`.
- **Task:** add the `desktop` branch to `generate-register-apps.ts` (build-order gate, `--backend
  cef`, discovery injection with **no** `withHttpEndpoint`, `Enabled:false` opt-in, random internal
  port); extend `AppEntry` (`@netscript/aspire/types`) with `Type:"desktop"`; unit tests mirroring
  `generators-*_test.ts`.
- **Reference (read-only):** eis-chat `aspire/PROPOSED-desktop-resource.md`,
  `aspire/.helpers/register-apps.mts` desktop block (merged eis-chat PR #136), `DESKTOP-SHELL.md`
  Aspire section.
- **IMPL-EVAL note:** OpenHands qwen 3.7 max. Gate: generator unit tests green; `scaffold.plugins`/
  `scaffold.runtime` unaffected for non-desktop configs. Full desktop-window render is an interactive
  step — not a headless-CI gate (note for the evaluator).

## Brief #E3 — tursodb single-writer relocation + in-process composition root

- **Model/effort:** GPT-5 Codex, **high** (native-driver lock semantics + Prisma-in-packaged-binary
  validation; the riskiest beta.8 slice).
- **## SKILL:** `netscript-doctrine` (database archetype, DbContext seam), `netscript-cli`
  (composition-root/scaffold wiring), `aspire` (data-dir/env conventions), `netscript-deno-toolchain`
  (Prisma/tursodb driver, `--unstable-kv`), `netscript-harness`, `netscript-pr`, `netscript-tools`.
- **Task:** per-user data-dir resolver; single-process host that resolves the dir, sets
  `DATABASE_URL`, `build()`s the service in-process, `registerInProcessService`; cutover guard against
  a second opener. Prove exactly one lock holder (no `os error 33`). Document that option (c) runs the
  db against a real-FS path → **no native-addon-in-VFS spike required**.
- **Bounded validation (O-2):** Prisma engine working inside a `deno desktop`-packaged binary against
  the per-user data dir. If it fails, STOP and file a spike issue — do not force it.
- **IMPL-EVAL note:** OpenHands qwen 3.7 max. Gate: single-writer proof + data-dir resolution +
  Prisma-in-binary validation evidence.

## Brief #E4 — true single-process mode (option c)

- **Model/effort:** GPT-5 Codex, **medium** (integration slice once #E1/#E3 land).
- **## SKILL:** `netscript-cli`, `aspire`, `netscript-doctrine`, `netscript-harness`, `netscript-pr`,
  `netscript-tools`.
- **Task:** wire the packaged dashboard's service clients through `transport:{mode:'in-process'}`;
  config-driven link-mode default; assert no listener/loopback for in-process-mounted services;
  identical generated client code web vs desktop except the flag.
- **Depends on:** #E1, #E3 merged (+ #E2 shell). **IMPL-EVAL:** OpenHands; gate on the
  launch→render→data-plane round-trip.

## Brief #E5 — offline-first (Turso Sync)

- **Model/effort:** GPT-5 Codex, **medium**.
- **## SKILL:** `netscript-doctrine` (database), `netscript-deno-toolchain` (Turso Sync surface),
  `netscript-harness`, `netscript-pr`, `netscript-tools`.
- **Task:** Turso Sync `pull`/`push` + `transform` in the single-process host; document conflict
  policy; gate the offline-first claim on option (c) only.
- **Depends on:** #E4. **IMPL-EVAL:** OpenHands; offline-operate + reconcile evidence.

## Brief #E6 — 1-click packaging + release/update server

- **Model/effort:** GPT-5 Codex, **medium-high** (cross-compile matrix + signing + Windows
  manual-apply indirection).
- **## SKILL:** `netscript-cli`, `netscript-release` (release/update-server, signing, race-free E2E),
  `aspire`, `netscript-harness`, `netscript-pr`, `netscript-tools`.
- **Task:** `deno desktop` cross-compile (`--target`/`--all-targets`, `--compress`, `--no-check`,
  explicit `-o`); release server (`latest.json` + bsdiff + Ed25519 manifests); Windows manual-apply
  fallback; local structural type layer over desktop-only globals.
- **Depends on:** #E2 + #E4. **IMPL-EVAL:** OpenHands; per-target signed binary + update stage/apply
  evidence.

## Brief #E7 — desktop/single-process deploy-e2e (stable)

- **Model/effort:** GPT-5 Codex, **medium**; the e2e run itself via OpenHands.
- **## SKILL:** `netscript-cli`, `netscript-release`, `netscript-tools` (e2e evidence, OpenHands
  triggers), `netscript-harness`, `netscript-pr`.
- **Task:** extend #394's bare-metal-first deploy-e2e harness with a desktop/single-process target;
  keep it out of `scaffold.runtime`. False-closed-checkbox discipline (#393/#394 pattern).
- **Depends on:** #393, #394, #E4, #E6. **IMPL-EVAL:** OpenHands runs the gate; `gate:e2e` checked
  only on green.

## Brief #E8 — signing automation (stable)

- **Model/effort:** GPT-5 Codex, **medium**.
- **## SKILL:** `netscript-release`, `netscript-cli`, `netscript-harness`, `netscript-pr`,
  `netscript-tools`.
- **Task:** automate macOS notarize / Windows signtool build steps; documented credential handling;
  no secrets in logs. **Depends on:** #E6.
