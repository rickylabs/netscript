## [Deploy-S2] Deployment target-adapter archetype doctrine entry — RESEARCH + PLAN

Phase 0 of the deployment epic (#327). This PR is **planning-only**: it lands the harness run
docs (`research.md` + `plan.md`) for the doctrine entry. **It does not author the doctrine change
itself** — that is the Implement phase, gated on a separate-session **PLAN-EVAL PASS**.

Closes #338
Refs #327

### Summary

Plans a new **Archetype 7 — Deployment Target Adapter** doctrine entry describing how a deploy
target (windows/servy, systemd, deno-deploy, docker/compose, k8s, aca) is structured:

- **Port seam:** generalize `WindowsServicePort` → `OsServicePort` (servy + systemd adapters);
  cloud targets wrap `aspire publish`/`aspire deploy`/`aspire do`; deno-deploy wraps `deno deploy`.
- **Uniform 7-op adapter contract:** `plan/emit · up · down · status · logs · rollback · secrets`.
- **Thin-CLI-router law:** no target business logic in the command surface; convention-bearing
  primitives (health, OTEL, secrets, rollback) live in a **core**, not per-target.
- **Config base:** each target's config member extends `DeployTargetBaseSchema` from #337 (PR #352).
- Archetype 7 **composes** Archetype 2 (Integration port/adapters) + Archetype 6 (CLI thin router)
  per A9's pick-larger-fold-smaller rule; it is the conformance target for adapter slices #339–#343.

### Scope

- **In:** `research.md`, `plan.md` (this PR). Plans edits to
  `docs/architecture/doctrine/06-archetypes.md`, `.llm/harness/archetypes/*`, and
  `.llm/harness/gates/archetype-gate-matrix.md`, plus an arch-debt entry — **for the Implement
  phase, not this PR.**
- **Out:** no `OsServicePort`/adapter/CLI implementation (Phase 1+); no `deploy-schema.ts` edit
  (that is #337); no doctrine renumber (that is #305); no labels/umbrella issue.

### #305 coordination

#305 (Architecture Doctrine revamp, RFC, OPEN, no in-flight branch) will renumber/restructure the
doctrine and stand up a fitness registry. The planned entry is written to be **absorbed** by #305:
durable archetype prose, named `F-DEPLOY-*` gates seeded `reviewed` (not `gated`, since #339+ are
unbuilt), no frozen tables, no dead `../phase-0-research/*` citations, and an inline `#305`
cross-reference. Archetype 7 (package *shape*) is orthogonal to #305's package-*graph* chapter.

### Status

- [ ] **PLAN-EVAL** (separate session, OpenHands) — required PASS before any doctrine content is
      authored.
- Planning-only until PLAN-EVAL PASS. Do not merge as an implementation.
