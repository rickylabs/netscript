# Context Pack — deploy-s3-baremetal

## What this run is

Planning-only harness run for the **bare-metal deploy targets** slice of epic #327: **#339**
(`WindowsServicePort → OsServicePort` + `SystemdAdapter`) + **#340** (`deno compile` single-binary
bare-metal artifact). One coherent bare-metal slice, Archetype 7. **#341 (rollback/health-gate/OTEL/
secrets) is out of scope.**

## State

- Phase: **IMPLEMENT in progress.** PLAN-EVAL **PASS** (cycle 2). Slices **S0–S4 committed, pushed,
  green**; **S5–S11 remain**.
- Branch `feat/deploy-s3-baremetal`, worktree `.claude/worktrees/deploy-s3`, base `origin/main`.
  Draft PR **#364 (still DRAFT — do not mark ready).** Run dir gitignored → `git add -f`.
- Artifacts: `research.md`, `plan.md`, `worklog.md`, `drift.md` (D1–D5), `commits.md`, this pack.

### Implemented slices (all green + pushed)

| Slice | SHA | What |
| ----- | --- | ---- |
| S0 | `12d70ff0` | `DeployTargetPort` → canonical 7-op contract (additive; **rebase point for #342/#343**). |
| S1 | `3bb1a80c` | `@netscript/config` `deploy.targets.linux` (`LinuxDeployTarget` + schema + exports) + `ResolvedLinuxDeployConfig` + `resolveLinuxDeploy`. |
| S2 | `50d7d599` | `WindowsServicePort` → `OsServicePort` clean rename (all importers, one commit). |
| S3 | `ce682fb7` | `ServyCliAdapter` → `ServyOsServiceAdapter`; folded servy **arg** construction into shared `servyInstallArgs`/`servyLifecycleArgs`; expanded regression matrix. |
| S4 | `454b4d81` | systemd Linux lane: `constants/linux.ts`, `kernel/adapters/linux/systemd/{systemd-unit.ts,systemd-command.ts}`, `public/adapters/systemd-os-service.ts` + tests. |

Per-slice gate every commit: cli `deno check` 0 (545 files at S4); config check/lint/fmt 0 (S1);
targeted deploy/systemd tests green. packages/cli is check-only under root fmt/lint; packages/config
is fmt/lint-gated.

### Drift recorded

- D1 `config-file.v1.json` is vendored Deno schema (no `deploy.targets`) — asset entry omitted.
- D2 resolved base-config dup across OS targets → consolidate at S7.
- D3 **S3↔S5:** servy *execution* free-fn `runServy` still used by start/stop/status + `upgrade-steps.ts`;
  S3 unified only the arg source-of-truth; execution convergence deferred to S5's command rewire.
- D4 systemd adapter placed in `public/adapters` (not `kernel/`) for hexagonal-layer symmetry.
- D5 Linux default consts duplicated between S1 resolver and `constants/linux.ts` → converge at S5/S7.

## Load-bearing facts

- #337 config contract (`DeployTargetBaseSchema`, `deploy.targets.windows`) is **merged on main**;
  this slice adds `deploy.targets.linux` (spread base). The old `deploy.windows.*` only appears on
  stale branches.
- #338 doctrine (Archetype 7 + F-DEPLOY-1/2 + reconciliation) is **PR #357, DRAFT, not on main** —
  read-only reference in the `deploy-s2` worktree. Sequence implementation after/with #357.
- Two seams ship on main: (a) 3-op stub `DeployTargetPort`/`WindowsServiceDeployTarget` + registry;
  (b) real `WindowsServicePort`/`ServyCliAdapter`. LD-1 unifies them (target adapter composes port).
- Two Windows call paths: install/uninstall use the port; start/stop/status call `runServy()`
  directly — must unify behind `OsServicePort`.
- File-size ceiling tight: `upgrade` 342, `build-windows-strategy` 301, `compile-runner` 292 → extract.

## Next action — resume at S5

Implement S5→S11 per `plan.md` §Commit-Slice List. Each slice: keep `deno check` green, targeted
tests green, commit with trailers `Refs #339 #340 #327` + Co-Authored-By + Claude-Session, append
`commits.md` (`git add -f`), push `HEAD:refs/heads/feat/deploy-s3-baremetal` (token via
`ssh codex-wsl '.../gh auth token'`, inline credential helper, no force). Keep PR #364 **draft**.

Concrete resume notes discovered while building S0–S4:

- **S5 (OS routing/wiring) — the keystone, non-trivial:**
  - Create `kernel/adapters/deploy/runtime-detect.ts`: `detectServiceOs(explicit?)` (defaults to
    `Deno.build.os`) + a factory that returns `ServyOsServiceAdapter` (windows) or
    `SystemdOsServiceAdapter` (linux) given `{process, servyCliPath, systemctlPath}`.
  - `public-command-dependencies.ts`: the deploy field is `windowsServices: ServyOsServiceAdapter`
    (built at ~line 308 with `DEFAULT_SERVY_CLI_PATH`). Route it to `osServices: OsServicePort` via
    the factory; keep Windows path byte-identical.
  - `install-service-deploy.ts` / `uninstall-service-deploy.ts` **have Windows naming hardcoded**:
    `fullServiceName` uses `DEFAULT_SERVICE_PREFIX` (`NetScript.<svc>`) and configPath
    `config/<svc>.xml`. OS-route the name + config extension (linux → `netscript-<svc>.service` via
    `fullUnitName`, `.service` unit path). `deploy_test.ts` asserts the Windows shape → keep windows
    the default so it stays green; add a linux-routing assertion.
  - **start/stop/status** are self-contained Cliffy actions (`start-deploy-command.ts` etc.) calling
    the free-fn `runServy` + guarding `if (Deno.build.os !== 'windows') throw WindowsRequiredError`.
    Folding these onto the port (D3) means relaxing the guard, OS-routing name construction, and
    routing `runServy` through the resolved port **while keeping `waitForHealth` in the command
    layer** (Hidden Scope — do not move health-poll into the port). `upgrade-steps.ts` also calls
    `runServy` (2 sites) — plan leaves upgrade untouched, so `runServy` stays for it.
- **S6 (#340 compile):** move `kernel/adapters/windows/compile/*` → `kernel/adapters/deploy/compile/*`;
  OS-generic triple + `--include`/denort; retire `deno:2.5` pin + dead docker/script config. Update
  all importers in the same commit.
- **S7:** split `build-windows-strategy.ts` (301 L) into OS-neutral orchestrator + per-OS emit (servy
  XML vs `renderSystemdUnit`); consolidate the D2/D5 base-config + Linux-const duplication here.
- **S8:** evolve `WindowsServiceDeployTarget` stub → real (delegate to `OsServicePort` + compile for
  `plan/up/down/status/logs`; leave `rollback?`/`secrets?` unsupported → #341); add
  `LinuxServiceDeployTarget`; **register `linux`** in `deploy-target-registry.ts`. **IMPL-3:** update
  `command-registry_test.ts:69` (the `['build','install','uninstall']` assertion) for the realized ops.
- **S9** tests + F-DEPLOY-2 evidence. **S10** docs + arch-debt (+ **IMPL-4:** fix stale "342" /
  "OpenHands/minimax" text in this context-pack's dispatch note below and any plan residue). **S11**
  validation sweep + the one-time expensive `deno task e2e:cli run scaffold.runtime --cleanup
  --format pretty` (Windows-only — will NOT exercise the Linux systemd lane; report exit code).

### Merge-order reminder

**#357 (doctrine) → S0 port-expansion (`12d70ff0`, already pushed) → #342/#343 rebase.** #342/#343
consume the 7-op `DeployTargetPort` and rebase onto S0; they do not use `OsServicePort`.

**Dispatch lane (port-ownership §correction):** implementers = **Opus 4.8 sub-agents** (WSL Codex is
dropped for the deployment epic); evaluators = separate Opus session. Do **not** follow the generic
"WSL Codex / OpenHands-minimax" lane.

## PLAN-EVAL history

- v1 (commit `94c332e3`): **FAIL_PLAN** — B1 (port-contract expansion bundled in old S7, not
  front-loaded). Non-blocking N1–N4.
- v2 (this revision): B1 fixed (S0 carved out + front-loaded); N1 (port is internal, no exports
  diff), N2 (S2 renames all importers in one commit), N3 (F-1 is 500/800 → 312-L `upgrade` fine, no
  extraction), N4 (dispatch lane = Opus 4.8) all folded in. Awaiting re-eval.
