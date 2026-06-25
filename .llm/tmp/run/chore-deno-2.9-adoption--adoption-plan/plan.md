# Plan — Deno 2.9.0 adoption (toolchain bump + low-risk wins)

Run: `chore-deno-2.9-adoption--adoption-plan` · branch `chore/deno-2.9-adoption` @ baseline
`origin/main` `c0020a1b`. This is a **planning-only** artifact for PLAN-EVAL; no implementation
begins until the verdict is `PASS`.

## Archetype & scope overlay

- This program touches **repo toolchain/CI/config + skill docs**, not package public surface. No
  package archetype gate applies to C0–C4 (config/CI/docs). The deferred C5/C6 touch
  `@netscript/cli` (A6 CLI application) and are **out of this plan** (see Deferred).
- Overlay: none package-specific. Validation is repo-level gates (`deno task ci`,
  `e2e:cli scaffold.runtime`).

## In-scope slices (this plan)

| Slice | Lane | Files | Gate |
|---|---|---|---|
| **C0** Bump Deno 2.8.3 → 2.9.x | supervisor (CI/config) | `.github/toolchain.env:7`; `ci.yml:47,68,98`; `e2e-cli.yml:57,87`; `publish.yml:23` | `deno task ci`; `e2e:cli run scaffold.runtime --cleanup` on 2.9 |
| **C1** Replace `run-parallel-tasks.ts` → `deno task --jobs` | supervisor (config + delete) | `deno.json:22` (`ci:quality`); delete `.llm/tools/run-parallel-tasks.ts` | `deno task ci:quality` exit 0; identical task set runs |
| **C2** Input-based task caching | supervisor (config) | `deno.json:23,49,50` (`files`/`output` on `check`/`lint`/`fmt:check`) | edit-a-file → task re-runs; no-edit → task skips; full check still green |
| **C3** Refresh `netscript-deno-toolchain` skill to 2.9 | supervisor (docs) | `.agents/skills/netscript-deno-toolchain/SKILL.md` (+ regenerate `.claude` mirror); touch `AGENTS.md:13`, `.llm/tools/README.md:22,82` | `validate-claude-surface.ts`; mirror regenerated, not hand-edited |
| **C4** Adopt/verify `deno publish` 2.9 resilience | supervisor (CI/config) | `.github/workflows/publish.yml` (document/confirm continue-after-failure #35133 + skip-published #35134 + asset-include #35331 behavior) | `publish:dry-run` clean on 2.9 |

## Locked decisions

- **D1 — Scope is C0–C4 only.** C5 (copy→`"links"`) and C6 (generated-project task DX) are
  **deferred** (D4). This plan delivers the bump + the no/low-risk wins for the alpha.3 window.
- **D2 — Lane split.** C0–C4 are CI/config/docs glue and root `deno.json` task wiring →
  **supervisor-implementable** (no `packages/`/`plugins/` source edits). The single deletion is a
  `.llm/tools/` harness script (C1). No framework source is touched in this plan; therefore no WSL
  Codex slice is required for C0–C4. If any C-slice is found to require a `packages/`/`plugins/`
  source edit during implementation, it converts to a Codex slice and is recorded in `drift.md`.
- **D3 — Breaking-risk handling is part of C0's gate, not deferred.** The 2.9→ bump must be
  validated by the full `e2e:cli run scaffold.runtime --cleanup` (catches `Deno.serve`
  compression-off #35486 in the HTTP/OTEL behavior checks) **and** a clean CI `deno install`
  (catches min-dep-age default-on #35458). If a behavior check depends on response compression, the
  fix is per-handler `automaticCompression: true` in the generated/runtime service, recorded as a
  C0 sub-commit — not a silent global env toggle.
- **D4 — Deferred, explicitly:**
  - **C5 copy→`"links"`** is a **spike-gated framework SOURCE Codex slice**, NOT in this plan. It may
    only become a slice after a PoC proves green against `scaffold.runtime` on the three B.2
    blockers (subpath resolution by bare specifier; `catalog:` against source; MySQL-adapter prune
    without source mutation). Recorded as a follow-up program.
  - **C6 generated-project task DX** is a follow-up Codex slice after C1/C2 prove out internally.
- **D5 — Decided-out (record to prevent re-litigation):** `bundle --declaration` (no fit; source
  publish + `isolatedDeclarations:true`); lockfile *seeding* (no scaffold consumer — fresh projects
  have no foreign lock to import). The `aspire/package.json` missing-lock DX gap is pre-existing
  arch-debt, not a 2.9 slice.
- **D6 — Lock hygiene / approval gate.** The bump may force a one-time reviewed `deno.lock` reseed.
  Per repo rule this **requires explicit user approval** before committing; the implementer must
  surface the lock diff and obtain approval, never commit a wholesale re-resolution silently.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `Deno.serve` compression-off changes runtime/test behavior (#35486) | Med | C0 gate runs full `scaffold.runtime`; per-handler opt-in if a check assumes compression (D3) |
| Min-dep-age default-on blocks/ warns CI installs (#35458) | Low | C0 gate verifies CI `deno install`; pinned catalog reduces exposure |
| `deno.lock` reseed churn | Med | D6 approval gate; CI not `--frozen` so non-fatal; reconcile diff |
| Input-cache (C2) masks a stale result | Low-Med | declare precise `files`/`output`; verify edit→rerun, no-edit→skip; keep `e2e` out |
| `--jobs` (C1) changes failure surfacing vs bespoke runner | Low | confirm identical task set + nonzero-on-any-failure semantics |
| Skill mirror drift (C3) | Low | regenerate `.claude` from `.agents`; run `validate-claude-surface.ts` |

## Validation (merge-readiness)

1. `deno task ci` green on 2.9.
2. `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green on 2.9 (the bump gate).
3. `deno task publish:dry-run` clean on 2.9.
4. C2: demonstrated cache hit/miss; C1: `ci:quality` parity; C3: `validate-claude-surface.ts` pass.
5. IMPL-EVAL (OpenHands qwen3.7-max, separate session) before merge.

## Plan-Gate self-check

- [x] Research present and current — re-baselined against `main` @ `c0020a1b` (+#126), 2.9 release-date sourced.
- [x] Commit slices < 30, each with files + gate (C0–C4).
- [x] Risk register with mitigations.
- [x] Gate set selected (repo-level: `ci`, `scaffold.runtime`, `publish:dry-run`).
- [x] Deferred scope explicit (C5 spike-gated, C6 follow-up; bundle/ seeding decided-out — D4/D5).
- [x] Decisions locked (D1–D6; no open decision that would force rework — the one genuine unknown,
      C5 transitive resolution, is explicitly OUT of scope and spike-gated).
- [x] Approval gate identified for lock reseed (D6).

## Deferred / debt
- C5 copy→`"links"` (spike-gated Codex slice). C6 generated-project task DX (follow-up Codex slice).
- `aspire/package.json` missing companion lock — pre-existing scaffold DX arch-debt.
