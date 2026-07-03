# Research — deploy-s3-baremetal (#339 + #340)

Bare-metal deployment slice: `WindowsServicePort → OsServicePort` + `SystemdAdapter` (#339, S3) and
`deno compile` single-binary bare-metal artifact (#340, S4). One coherent bare-metal slice under
Archetype 7. #341 (S5 hardening: rollback + health-gate + OTEL + secrets) is **out of scope** but
consumes this slice.

## Re-baseline

- **Carried-in source:** epic #327 decomposition + the settled Archetype 7 doctrine (PR #357 draft,
  in the `deploy-s2` worktree) + the op-contract reconciliation note
  (`.llm/tmp/run/deploy-s2-doctrine/contract-reconciliation.md`). Read read-only; not re-litigated.
- **Re-derived against `main`** @ `bf0113df` (`docs: incremental-beta roadmap … (#360)`), the tip of
  `origin/main` at worktree-creation time (2026-07-03). Worktree `deploy-s3`, branch
  `feat/deploy-s3-baremetal`, created off `origin/main`.
- **What changed vs the carried-in view:**
  - **#337 (S1) config contract is MERGED to `main`** (issue CLOSED). The working tree I started
    from (`fix/cli-db-init-flake`) predated it and still showed the old `deploy.windows.*` schema —
    that was a stale-branch artifact. On `origin/main`, `packages/config/src/domain/schemas/
    deploy-schema.ts` ships `DeployTargetBaseSchema` + `WindowsDeployTargetSchema` under
    `deploy.targets.windows` (clean break per D5, no `deploy.windows.*` alias). This slice adds a
    sibling `deploy.targets.linux` member by **spreading** `deployTargetBaseShape` (R-DEPLOY-4).
  - **#338 (S2) doctrine is NOT yet merged** — it lives in PR #357 (draft, branch
    `feat/deploy-s2-doctrine`). The Archetype 7 chapter, the `ARCHETYPE-7-*` harness file, the
    `F-DEPLOY-1/2` gate seeds, and the op-contract reconciliation are all in the `deploy-s2`
    worktree, not on `origin/main` yet. **Dependency: this slice's plan treats the 7-op contract as
    LOCKED, but implementation should land after (or coordinate with) #357 so the doctrine + gates
    are on `main`.** See Dependencies + Risk Register.

## Findings

| #  | Finding | How to verify |
| -- | ------- | ------------- |
| 1  | Canonical adapter contract = **7 ops**: `plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets`. Adapters implement the **subset** they support; `F-DEPLOY-*` seeded `reviewed`. | `deploy-s2/…/ARCHETYPE-7-deploy-target-adapter.md` §Uniform Adapter Contract; `06-archetypes.md` L280-300 |
| 2  | **Two distinct seams exist on `main` today** — they are at different levels and this slice unifies them: (a) `DeployTargetPort` (3-op `build`/`install`/`uninstall`, all optional) + stub `WindowsServiceDeployTarget` (key `windows-service`) + `DeployTargetRegistryPort` — the Archetype-7 *target-adapter* seed (commit `3137e455`, a stub, canned messages); (b) `WindowsServicePort` (`install`/`start`/`stop`/`status`/`uninstall` via `run()`) + real `ServyCliAdapter` — the working *OS-service-lifecycle* port the live deploy commands actually call. | `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`; `…/windows-service-deploy-target.ts`; `…/deploy-target-registry-port.ts`; `packages/cli/src/public/ports/windows-service-port.ts`; `…/public/adapters/servy-cli.ts` |
| 3  | The reconciliation LOCKS: 7-op is canonical; the 3-op `DeployTargetPort` is the *seed* to expand; **verb-vocabulary lock is deferred to the first real adapter — i.e. THIS slice (#339/#340)**; map `build→plan/emit`, `install→up`, `uninstall→down`; `status`/`logs`/`rollback`/`secrets` are net-new. | `deploy-s2/…/contract-reconciliation.md` Decision §3 |
| 4  | `ServyCliAdapter` shells `servy-cli.exe` through a `ProcessPort` (`exec(path, args)`), translating exit code → `{success,message,code}`. Windows-only assumptions: `.exe` path default, servy XML config (`servy-xml.ts`/`servy-writer.ts`), `NetScript.<name>` service naming (`kernel/constants/windows.ts`), `C:\` install-base defaults. A systemd adapter needs the analogous unit-file rendering + `systemctl` calls behind the **same** port. | `public/adapters/servy-cli.ts`; `kernel/adapters/windows/servy/*`; `kernel/constants/windows.ts` |
| 5  | `deno compile` build machinery already exists but is **Windows-shaped**: `build-windows-strategy.ts` (301 L), `compile-runner.ts` (292 L), `compile-bundler.ts`, `CompileTarget` (`type`, `entrypoint`, `permissions`, `include[]`, `compileTarget` triple), `CompileResult`/`BuildResult`. Config default triple is `x86_64-pc-windows-msvc`; `.exe` output assumed. #340 generalizes triple selection (5 cross-compile triples), `--include`/`--include-as-is` asset embedding, denort, and retires the dead `deno:2.5` pin + unused compile-config fragments. | `public/features/deploy/build/build-windows-strategy.ts`; `kernel/adapters/windows/compile/compile-runner.ts`; `kernel/domain/deploy/compile-target.ts`; `deploy-schema.ts` `compileTarget` default |
| 6  | Existing `deploy` CLI command surface (thin router candidate): `build`, `package-cli`, `copy`, `install`, `start`, `stop`, `status`, `logs`, `uninstall`, `upgrade` — wired in `deploy-group.ts`; deps constructed in `public-command-dependencies.ts` (`windowsServices`, `manifestPort`). Live commands call `WindowsServicePort`/manifest, **not** the stub `DeployTargetPort`. So the 7-op ops are *already partly implemented* as commands; this slice re-seats them behind the OS-agnostic port. | `public/features/deploy/deploy-group.ts`; `public/features/root/public-command-dependencies.ts`; `public/features/deploy/install/install-service-deploy.ts` |
| 7  | **7-op coverage for the bare-metal target after this slice** (subset): `plan`/`emit` = deno compile artifact (**#340, in scope**); `up` = OsServicePort install+enable+start (**#339, in scope**); `down` = OsServicePort stop+disable+uninstall (**#339**); `status` = OsServicePort status (**#339**); `logs` = servy logs / `journalctl` (**#339**); `rollback` = **DEFERRED → #341** (declared-unsupported subset this slice); `secrets` = **DEFERRED → #341** (basic env-file secrets are S5). | epic #341 acceptance criteria; ARCHETYPE-7 subset rule |
| 8  | File-size headroom is tight on the files this slice touches: `upgrade-deploy-command.ts` 312 L, `build-windows-strategy.ts` 301 L, `compile-runner.ts` 292 L. Generalization must **extract**, not grow these past the F-1 ceiling. | `wc -l` over `packages/cli/src/**/*deploy*|*compile*` |
| 9  | Config member for Linux must **spread** `deployTargetBaseShape` (as `WindowsDeployTargetSchema` does) and add only systemd-specific fields (`systemctlPath`, `unitPrefix`, `installBase`, `user`/`group`, `runtimeDir`), plus the matching `LinuxDeployTarget` type in `config-section-types.ts` — no per-target base-class hierarchy (R-DEPLOY-4 / A5). | `deploy-schema.ts` `WindowsDeployTargetSchema` pattern; `config-section-types.ts` `WindowsDeployTarget` |
| 10 | Deploy today stays **inside `packages/cli`** (Archetype 6 host); the `deploy-core` package extraction is an explicitly *later* wave. So `OsServicePort` + adapters + the bare-metal target adapters are **package-owned within `packages/cli`** for this slice — do not extract a new package. | `06-archetypes.md` L302-308, L353 |

## jsr-audit surface scan (package wave — `@netscript/cli`)

- **Surface scanned:** `@netscript/cli` public exports (`packages/cli/deno.json` exports map;
  `public/public-api.ts`, `public/ports/*`, `public/adapters/*`). This slice adds/renames public
  port + adapter types (`OsServicePort`, `OsServiceCommandResult`, systemd/servy adapters) and a
  config type (`LinuxDeployTarget`).
- **Slow-type / surface risks to name before slicing:**
  - Renaming/generalizing `WindowsServicePort` → `OsServicePort` is a **public-surface change** to
    `@netscript/cli`. Must keep every exported type explicitly annotated (no inferred slow types),
    keep `@module` JSDoc, and update the `deno.json` exports + `public-api.ts` barrel. Run
    `deno doc --lint` / F-6 publishability on the changed surface.
  - Decide whether `WindowsServicePort` stays as a deprecated re-export or is a **clean break**
    (D5-consistent: repo is alpha, clean breaks allowed). See Open Decisions.
  - New `@netscript/config` type `LinuxDeployTarget` extends `DeployTargetBase` — verify it renders
    in `deno doc` and does not introduce a slow type.
- Not N/A — this is a package wave touching two package public surfaces (`@netscript/cli`,
  `@netscript/config`).

## Open questions (carried into the plan's Open-Decision Sweep)

1. **Verb vocabulary lock.** The reconciliation defers the canonical verb-name lock to this slice.
   Keep `build/install/uninstall` CLI verbs, adopt `up/down`, or hybrid? (Proposed: lock the *port*
   op names to the canonical 7-op set; keep existing CLI command names as thin-router aliases →
   no CLI-UX churn, no rework.) — resolve now (names are load-bearing for F-DEPLOY-1).
2. **`WindowsServicePort` fate** — clean rename to `OsServicePort` vs deprecated re-export shim.
   (Proposed: clean break, alpha repo, D5 precedent.) — resolve now.
3. **Does this slice rewire the live CLI commands through the 7-op `DeployTargetPort` target
   adapters, or only generalize the `OsServicePort` + adapters and route by OS?** (Proposed: evolve
   the `WindowsServiceDeployTarget` stub into a real bare-metal target adapter that *composes*
   `OsServicePort` + the compile build, add a `LinuxServiceDeployTarget` sibling, register both;
   keep the live commands calling the port but sourced through the registry by host OS — avoids a
   parallel reimplementation and satisfies "evolve the stub".) — resolve now (scope-defining).
4. **Systemd rollback/health-gate seam** — declared-unsupported this slice (→ #341) but the port
   method **signatures** should exist so #341 fills bodies without a contract change. Confirm the
   port declares `rollback?`/`secrets?` as optional (subset) now. — safe to defer bodies; declare
   surface now.
5. Coordination with PR #357 (doctrine + gates not yet on `main`). — resolve sequencing now
   (see Dependencies).
