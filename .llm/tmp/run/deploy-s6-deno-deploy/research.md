# Research — deploy-s6-deno-deploy

Slice **#342 [Deploy-S6]** — "Deno Deploy tier-1 adapter (MARQUEE)". Phase 2 of the deployment
epic **#327**, decision **D2**. **PLAN-ONLY** run: research + plan + draft PR, then a
separate-session PLAN-EVAL. No adapter/CLI/schema code is written here.

> **Revision 2 (post-FAIL_PLAN).** The first plan was returned `FAIL_PLAN` (blocking finding B1)
> because it misattributed the shipped 3-op deploy port to #338 and demoted the ratified 7-op
> doctrine to "stale corpus." This revision corrects the misattribution, conforms to the **canonical
> 7-op Archetype 7 contract**, re-baselines against **merged** `main`, and records that #342
> **consumes** (does not own) the port expansion owned by **#339/#340**. Authoritative sources:
> `.claude/worktrees/deploy-s2/.llm/tmp/run/deploy-s2-doctrine/contract-reconciliation.md` and
> `.claude/worktrees/deploy-s3/.llm/tmp/run/deploy-s3-baremetal/port-ownership.md` (epic #327
> supervisor decisions — internal architecture decisions, not user product decisions).

## Re-baseline

- **Worktree base is STALE.** Branch `feat/deploy-s6-deno-deploy` forked from `cf1ac47b`, which
  **predates** the deployment merges. Re-derived against **merged `origin/main` @ `37108172`**
  (verified 2026-07-03).
- **What is already merged to `main` (verified firsthand):**
  - **`#352`** `44d7945b [Deploy-S1] deploy.targets.* config contract (clean break)` — the
    `deploy.targets.*` schema + `DeployTargetBaseSchema` now live at
    `packages/config/src/domain/schemas/deploy-schema.ts` on `main`. The clean-break merge
    **preserved** the spread + `z.ZodType<T>` pattern (`deployTargetBaseShape`,
    `WindowsDeployTargetSchema` spreads `...deployTargetBaseShape`, `DeployConfigSchema.targets.windows`).
    → **The "#337 not merged" premise from rev 1 is dropped.**
  - **`3137e455`** `Slice 2: command registry deploy port E2E green` — landed the **3-op**
    `DeployTargetPort` (`build|install|uninstall`, all optional) +
    `WindowsServiceDeployTarget` stub + `DeployTargetRegistry` at
    `packages/cli/src/kernel/domain/deploy/**`. This is an **unrelated command-registry slice**, NOT
    #338, and NOT part of the deployment epic design. → **Rev 1's misattribution corrected.**
- **What is in-flight / inbound (Implement-phase dependencies):**
  - **`#357` (#338 impl)** — ratifies **Archetype 7** deploy-target-adapter doctrine (the canonical
    **7-op** contract). IMPL-EVAL **PASS** at the merge gate. Doctrine file:
    `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`.
  - **`#339/#340` (Deploy-S3 bare-metal)** — **OWNS** expanding the seed 3-op `DeployTargetPort` →
    the canonical **7-op** `OsServicePort`/cloud-adapter contract, and performs the verb-vocabulary
    lock. It front-loads this as an **early independently-mergeable port-contract commit**.
- **Merge order for Implement:** `#357` (doctrine) → `#339/#340` port-expansion commit → **rebase
  #342** onto both (plus current `main`, which already carries #352 + `3137e455`).

## Findings

| #  | Finding (fact the plan depends on) | How to verify |
| -- | ---------------------------------- | ------------- |
| 1  | **Config base is merged.** `origin/main:packages/config/src/domain/schemas/deploy-schema.ts` defines `deployTargetBaseShape` (const), `DeployTargetBaseSchema: z.ZodType<DeployTargetBase>`, `WindowsDeployTargetSchema` spreading `...deployTargetBaseShape`, and `DeployConfigSchema.targets.windows`. New members are sibling keys added by spread (R-DEPLOY-4: no per-target base-class hierarchy). | `git show origin/main:packages/config/src/domain/schemas/deploy-schema.ts` |
| 2  | **Config types merged.** `config-section-types.ts` on `main` declares `DeployTargetBase`, `WindowsDeployTarget extends DeployTargetBase`, `DeployConfig.targets`. A `deno-deploy` member needs a `DenoDeployTarget` interface + `DenoDeployTargetSchema: z.ZodType<DenoDeployTarget>` (explicit types — `isolatedDeclarations` + JSR slow-type). | `git show origin/main:packages/config/src/domain/config-section-types.ts` |
| 3  | **The shipped 3-op port is a SEED STUB from `3137e455`, not #338.** `deploy-target-port.ts` `DeployTargetPort { key; label; operations: ('build'\|'install'\|'uninstall')[]; build?/install?/uninstall? }`; `WindowsServiceDeployTarget` returns canned messages, no real work. It is a placeholder to be **expanded** to 7-op by #339/#340 — not the canonical contract. | `git show origin/main:packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`; `git log --oneline -1 3137e455` |
| 4  | **Canonical contract = Archetype 7's uniform 7-op set** (#357, IMPL-EVAL PASS): `plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets`. Each adapter implements the **subset it supports**; Aspire adapters delegate `up`/`plan` to Aspire; deno-deploy wraps `deno deploy`. | `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md` §"Uniform Adapter Contract" |
| 5  | **Archetype 7 is a COMPOSITE.** It composes **Archetype 2** (Integration — package-owned `OsServicePort` + cloud adapters, closed-on-key `deploy-target-registry`) and **Archetype 6** (thin `netscript deploy <target> <verb>` router), folding neither. Router carries **no target-specific business logic** (R-DEPLOY-2); convention-bearing primitives (health, OTEL, **secrets, rollback**) live in the **core**, shared across targets (R-DEPLOY-3). | ARCHETYPE-7 §"Composition", §"Rules" |
| 6  | **Port ownership: #339/#340 owns the 3-op→7-op expansion; #342 CONSUMES.** #342/#343 implement adapters against the expanded 7-op port and **MUST NOT redefine the port or op contract**. Verb-lock resolved: canonical = the 7 doctrine op names; legacy CLI verbs (`build/install/uninstall`) remain user-facing aliases. | `.../deploy-s3-baremetal/port-ownership.md` §Decision 1–4 |
| 7  | **External-CLI shell pattern (unchanged).** `ServyCliAdapter implements WindowsServicePort` shells `servy-cli.exe` via a `ProcessPort`, mapping exit code → result. Mirror this for shelling `deno deploy` (a `ProcessPort`-driven adapter, not ad-hoc `Deno.Command`). NOTE: `main` also has a **real** `WindowsServicePort`+`ServyCliAdapter` seam (start/stop/status bypass the port via `runServy()` today); #339/#340 unifies both seams behind the port. | `packages/cli/src/public/adapters/servy-cli.ts`; port-ownership.md §Facts |
| 8  | **Deno Deploy = NEW platform, source-driven, no Dockerfile.** Target is *Deno Deploy* (`console.deno.com`, `deno deploy` CLI), NOT deprecated Deploy Classic / Subhosting (deployctl, sunset 2026-07-20). Serverless microVM; remote 5-stage build (Queue→Prepare→Install→Build→Deploy) from source; build config from `deno.json`/`deno.jsonc` + dashboard. | https://docs.deno.com/runtime/reference/cli/deploy/ |
| 9  | **Runtime constraint (critical guard).** Deno Deploy runtime is pinned, runs `--allow-all`, and **rejects `--unstable-*` flags**. NetScript scaffolds use `--unstable-kv`. A deployed app importing unstable APIs (Deno KV) fails on-platform → an **unstable-API preflight guard** is required in `plan`/`up`. | https://docs.deno.com/... ; decision-gap-tracker.md "Blockers" |
| 10 | **`deno deploy` CLI surface (live, 2026).** `deno deploy` (deploys cwd; `--prod`); `deno deploy create --org --app --source github\|local --runtime-mode dynamic\|static --entrypoint --framework-preset <fresh…> --install-command --build-command --static-dir`; `deno deploy env add <k> <v> [--secret]` / `env load <file>`; `deno deploy switch --org --app`; `deno deploy logs`; `deno deploy logout`; `deno deploy database`. | https://docs.deno.com/runtime/reference/cli/deploy/ |
| 11 | **Auth model (CI open question).** New `deno deploy` uses OS-keyring token-based auth, auto-prompting interactively; supports user + organization tokens. The docs do **not** confirm a non-interactive env var for the new CLI (classic `deployctl` used `DENO_DEPLOY_TOKEN`). → `NEEDS USER`. | https://docs.deno.com/... ; https://docs.deno.com/deploy/classic/deployctl/ |
| 12 | **Existing debt this advances.** `arch-debt.md` carries the deployment `Archetype-7 core-centralization + F-DEPLOY seed` entry and the `cli-deploy-artifacts-missing` / AP-1 command-registry-deploy-seams entries. This slice advances the cloud-adapter portion; it does not close them. | `.llm/harness/debt/arch-debt.md` |
| 13 | **F-DEPLOY gates are seeded `reviewed`.** `F-DEPLOY-1` (each adapter implements the 7-op contract or a declared subset) and `F-DEPLOY-2` (thin router, conventions in core) are seeded `reviewed` until the deployment packages exist, then promoted `gated`. | ARCHETYPE-7 §"Fitness Gates"; gate matrix |
| 14 | **Dispatch-lane override (this epic).** Implementers = **Opus 4.8 sub-agents only**; evaluators = separate Opus session (or Codex GPT-5.5 when reachable). **WSL Codex is dropped for the deployment epic.** Rev 1's generic "WSL Codex impl / OpenHands PLAN-EVAL" next-step is corrected. | port-ownership.md §"Dispatch-lane correction" |

> **Slice-number note (drift):** `ARCHETYPE-7-deploy-target-adapter.md` line ~13 still carries an
> earlier parenthetical mapping (`#340 deno-deploy, #342 docker/compose`). The **current
> authoritative** mapping (this task + both rev-2 decision docs) is **#342 = Deno Deploy**. The stale
> parenthetical is #338's doc to correct (its contract-reconciliation already schedules an additive
> follow-up); #342 does not edit it. Logged so PLAN-EVAL is not misled.

## Deno Deploy deployment model (target being wrapped)

- **Platform:** the NEW **Deno Deploy** (dashboard `console.deno.com`, built-in `deno deploy`
  subcommand). Deploy **Classic** (deployctl / Subhosting v1, sunset 2026-07-20) is a **non-target**.
- **Deployment unit:** an **organization → app** (app = deployable; deployments = its revisions).
  `deno deploy switch --org --app` sets default context; otherwise `--org`/`--app` per invocation.
- **Two push modes (product default — see plan open decision):** (1) **CLI push** — `deno deploy`
  from project root uploads source + triggers a remote build (deterministic, one-shot, the natural
  marquee one-click); (2) **GitHub-push auto-build** — the Deno Deploy GitHub app builds on push
  (NetScript would *configure*, not *drive*).
- **Build model:** remote, source-driven, **no Dockerfile**; 5 stages; build settings from
  `deno.json`/`deno.jsonc` (app dir, framework preset, install/build/pre-deploy commands, runtime
  mode) + dashboard. NetScript's job: ensure valid Deploy build settings + invoke/verify — **wrap,
  do not reinvent** the remote builder.
- **Runtime constraints:** pinned Deno, `--allow-all`, **no `--unstable-*`** — the single most
  important caveat for NetScript's KV-backed plugins → preflight guard (Finding 9).
- **Auth/token:** OS-keyring token, interactive auto-prompt, user or org tokens; non-interactive CI
  path unconfirmed for the new CLI (Finding 11) → `NEEDS USER`.
- **Secrets:** `deno deploy env add [--secret]` / `env load`, per environment — mapped through the
  **core secrets convention** (R-DEPLOY-3), not per-target ad-hoc code.

## 7-op contract → Deno Deploy adapter mapping (the corrected op contract)

Deno Deploy is a **hosted platform**: it has no OS-host install/uninstall concept, so it implements
the **declared subset** of the canonical 7-op contract it supports (R-DEPLOY-1). **`#342` does not
define these ops — it consumes the 7-op port from #339/#340 and implements this subset.**

| Canonical op   | Deno Deploy mapping | Support |
| -------------- | ------------------- | ------- |
| `plan`/`emit`  | Preflight: validate `deno.json` Deploy build settings + run the **unstable-API guard**; compute the deploy plan without mutating the platform. | **Supported** (local, no remote call) |
| `up`           | **`deno deploy`** (preview) / **`deno deploy --prod`** (production) — the marquee one-click push. | **Supported** (marquee) |
| `down`         | Tear down = delete the Deno Deploy **app/deployment** (platform-native, via API/dashboard; CLI verb TBD). Distinct from an OS-host uninstall. | **Supported** (platform-native; CLI-surface TBD) |
| `status`       | Report deployment/app state via the platform API. | **Supported** (platform API) |
| `logs`         | **`deno deploy logs`** (platform API). | **Supported** |
| `rollback`     | Platform-**native** rollback (repoint to a prior good deployment) — routed through the **core rollback convention**, NOT a silent no-op (R-DEPLOY-3). | **Supported** (platform mechanism) |
| `secrets`      | **`deno deploy env add [--secret]` / `env load`**, via the **core secrets convention** (R-DEPLOY-3). | **Supported** |
| (host install/uninstall) | N/A — no OS-service install for a hosted platform. | **Explicitly unsupported** (declared subset) |

## #352 / #357 (#338) / #339-#340 dependency status

- **`#352` (Deploy-S1 config lineage) — MERGED to `main`.** `deploy.targets.*` +
  `DeployTargetBaseSchema` landed (Findings 1–2). #342's config member **spreads**
  `DeployTargetBaseSchema` (composition, not a new base — R-DEPLOY-4).
- **`#357` (#338 doctrine) — IMPL-EVAL PASS, at merge gate.** Ratifies Archetype 7 (7-op canonical).
  #342 conforms; cite Archetype 7 by name (S-1). Implement rebases after #357 merges.
- **`#339/#340` (bare-metal) — OWNS the 3-op→7-op port-contract commit (front-loaded).** #342
  **consumes** the expanded 7-op port and rebases onto that commit; #342 does **not** redefine the
  port or op vocabulary (Finding 6).
- **Merge order:** `#357` → `#339/#340` port-expansion commit → **rebase #342**. Stated so Implement
  does not begin against the 3-op seed or a missing 7-op port.

## jsr-audit surface scan (package/plugin waves)

- **Surface scanned (planned):** `packages/config` new public `DenoDeployTarget` type +
  `DenoDeployTargetSchema`; `packages/cli` new adapter is **internal** (registered via the registry,
  no new public *type* export).
- **Slow-type / surface risks:** `packages/config` under `isolatedDeclarations` — annotate
  `DenoDeployTargetSchema` as `z.ZodType<DenoDeployTarget>` exactly like `WindowsDeployTargetSchema`;
  `DenoDeployTarget` carries explicit field types. `packages/config` is **published** →
  `deno publish --dry-run` is a required S1 gate.
- **Verdict:** low surface risk if the merged spread + `z.ZodType<T>` pattern is followed; PLAN-EVAL
  confirms the annotation before slicing.

## Non-goals (deferred to `stable` per D-tiers; explicit)

- HA / multi-region / autoscaling policy (Deno Deploy manages it).
- Managed Postgres/KV wiring (`deno deploy database` → NetScript DB layer) — deferred follow-up.
- GitHub-push auto-build orchestration beyond emitting/validating build settings — CLI-push is the
  beta default (pending open decision).
- **Owning or redefining the deploy port / op vocabulary** — owned by #339/#340; #342 consumes.
- **The `OsServicePort` + full multi-target router build** — that is #339/#340 core work; #342 adds
  the deno-deploy cloud adapter behind it + the target's registry entry.
- Deploy Classic / deployctl / Subhosting — deprecated, not targeted.

## Open questions (closed in `plan.md`)

1. CLI-push vs GitHub-push default for the marquee? → `NEEDS USER` (proceed CLI-push, reversible).
2. Non-interactive CI auth for the new `deno deploy`? → `NEEDS USER` + Implement-time freshness
   re-check; design behind a fake `ProcessPort` so unit tests need no real auth.
3. Exact `down`/`rollback`/`status` CLI-vs-API surface (platform-native mechanisms) → confirm at
   Implement against the then-current platform API; adapter isolates each op behind the port.
