# Wave 6 — `@netscript/cli` — RESEARCH-ONLY brief

> **Phase:** RESEARCH ONLY. No implementation, no refactor, no file moves in `packages/`.
> The deliverable is analysis + a proposed target architecture + seams, not code.
> Wave 6 is the **last** S1 Package-Quality wave (Waves 0–5 merged → track `82c1185`).

## Why this research exists

`@netscript/cli` is no longer "the scaffolder." It has grown into the operational
front-door of the framework and will keep growing. Before we do the Wave 6
quality pass (A6 gates, doc-lint, README/docs, slow-types) we want a **deliberate,
enterprise-grade target architecture** so the quality pass restructures toward the
right shape instead of polishing the current one.

## Maintainer feedback (verbatim intent — the spine of this research)

1. **The CLI owns more than scaffolding.** It also manages **runtime features** and
   **deployment**, and will hold **more** in future. It needs an **absolute
   enterprise-grade folder structure** with real **separation of concerns (domains)**.
2. It needs **strong standards** (naming, layering, error model, command contract,
   output/IO discipline, testing) — codified, not implicit.
3. It needs to be **ready for future implementation** (extensible command surface,
   plugin points, stable internal seams).
4. **Deployment today targets Windows but is a hand-patched system.** We aim to use
   **Aspire 13.4 latest features** to deploy to other targets (**k8s** and others).
   *No implementation in this wave* — produce **seams + prior research** only.
5. The **scaffolding** part is **not bad but could be improved** — identify concrete,
   bounded improvements.
6. **Do your own analysis on top of this** — surface issues the maintainer did not name.

## Current-state baseline (measured 2026-06-14 @ `fcef53d`, do not trust blindly — re-verify)

- `packages/cli/src` top-level domains today: **`kernel/`, `local/`, `maintainer/`, `public/`**.
- `kernel/adapters/` already spans many concerns: `config/`, `contracts/`, `database/`,
  `deploy/` (+ `deploy/commands/`), `loggers/`, `plugin/`, `runtime/`
  (`clock`, `file-system`, `platform`, `process`, `prompt`), `scaffold/`, `service/`,
  `templates/` (+ `templates/app/`), and **`windows/`** (`compile`, `environment`,
  `manifest`, `runtime`, `servy`) — i.e. the **hand-patched Windows deployment** lives here.
- `kernel/application/`: `abstracts/`, `registries/`, `scaffold/` (+ `writers/`), `ui/`.
- Open debt: **`packages/cli` AP-1 / doctrine verdict Restructure** in
  `.llm/harness/debt/arch-debt.md` (gates F-1, F-3, F-10, AP-18 manual review).
- Doctrine archetype: **A6 — cli-tooling** (gate matrix in
  `.llm/harness/gates/archetype-gate-matrix.md`).
- The CLI is also the **docs-site source of truth for S5** and references every other
  unit at `0.0.1-alpha.0` (it ships last by design).

## Research questions (answer each with evidence + a recommendation)

### A. Domain decomposition & enterprise folder structure (feedback 1, 3, 6)
- What are the CLI's **true bounded domains**? Candidate split: **scaffold**, **runtime**
  (dev/serve/process supervision), **deploy** (targets + packaging), **maintainer**
  (workspace/codegen/registry), **plugins**, **diagnostics/doctor**, plus a **kernel**
  (ports/adapters/process/fs/clock/prompt) and a thin **public** command surface.
- Map each current folder → proposed domain; flag cross-domain coupling and the
  `windows/` deployment concern that should become one adapter behind a `deploy` port.
- Reconcile with Doctrine 05 canonical role folders and the A6 gate matrix. Where does
  `kernel/` (non-canonical) fit, and how do command handlers, adapters, ports, and
  presets/registries lay out under `src/` with ≤12 children/dir, ≤4 depth, ≤500 LOC files?
- Resolve the open **AP-1 Restructure** debt: propose the concrete target tree.

### B. Standards (feedback 2)
- Propose a **CLI standards doc** (to live under `packages/cli/docs/`): command-contract
  shape (args/flags/exit codes), **error model** (typed errors, user-facing vs internal),
  **IO/output discipline** (human vs `--json`, stdout/stderr split, quiet/verbose,
  no `console.*` in domain code → structured reporter), naming, testing tiers
  (unit/integration/e2e), and the public-surface/`deno doc --lint` rules.
- Identify where today's code violates these and would need to move (catalog only).

### C. Future-impl readiness & extensibility (feedback 3)
- Where are the **stable internal seams** for adding commands/targets without churn?
  Command registry, port interfaces, adapter registration, preset/config layering.
- What must be **protected (not implemented)** now so future work needs no breaking change?

### D. Aspire 13.4 deployment seams (feedback 4 — SEAMS + PRIOR RESEARCH ONLY)
- Read `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` and the
  `packages/aspire/` wrapper first. Then research **Aspire 13.4's latest deployment
  features** (publishers/deployers, `aspire publish`/`aspire deploy`, compute-environment
  abstractions, k8s + container-app + other targets).
- Propose a **`deploy` port + target-adapter seam** so the current hand-patched Windows
  path becomes one adapter alongside future **k8s / container / cloud** adapters driven by
  Aspire 13.4 — **design only, zero implementation**. State exactly which Aspire 13.4 APIs
  each future adapter would wrap (wrap-don't-reinvent), and what stays out of scope.
- Cross-check against the `aspire` skill (`.agents/skills/aspire/SKILL.md`).

### E. Scaffolding improvements (feedback 5)
- The scaffold path works (Wave 5 D2 proved `scaffold.runtime` E2E 41/41). Catalog
  **bounded, concrete** improvements: template organization, generator config surface,
  import-map/`PACKAGE_TO_LOCAL_PATH` maintenance, drift tests, idempotency, error UX.
- Keep this incremental — it is the part we are NOT rebuilding.

### F. Your own analysis (feedback 6)
- Surface unnamed risks: slow-types/`deno publish --dry-run` blockers (mind the
  documented `--dry-run` false positive — see nested PLAN §9), over-cap files,
  `console.*` leakage, vendor-type leaks in the public surface, test gaps, the
  `e2e/` workspace member that references neither queue/cron nor streams/watchers
  (flagged by Waves 2 & 4 as Wave-6-owned).

## Deliverable (write-artifact-first)

Create and incrementally fill **`research.md`** in this run dir:
- one section per research area A–F, each ending in a concrete **recommendation**;
- a **proposed target `src/` tree** for `packages/cli` (the AP-1 answer);
- a **deploy-seam design** (ports + named Aspire 13.4 APIs per future target, no code);
- a **standards outline** for `packages/cli/docs/standards.md`;
- a **risk register** + a suggested **Wave 6 implementation slice plan** (for the LATER
  impl phase — not executed here).

End the OpenHands summary with one line: `RESEARCH COMPLETE` (no verdict, no implementation).

## Hard boundaries

- **No edits to `packages/`** and **no `.md` rewrites of existing package docs.** New
  analysis artifacts in this run dir only.
- No publish, no version bumps, no template `jsr:` rewrites (that is S3).
- Deployment is **seams + research only** — do not implement any Aspire deploy path.
