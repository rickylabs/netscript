# GENERATOR BRIEF — Wave 6 `@netscript/cli`, Slices 0 → 1 → 2 → 3 → 5 (continuous)

> You are the **GENERATOR** (Codex, native WSL/ext4). The plan PASSED PLAN-EVAL
> (MiniMax M3, cycle 1/1 — see `…/plan-eval.md`). Implementation is authorized.
> The evaluator is a SEPARATE session; do not self-evaluate.

## 0. Operating contract (NON-NEGOTIABLE — read first)

- **Environment:** work ONLY in the native ext4 worktree
  `/home/codex/repos/netscript-wave6-cli` (branch `feat/package-quality-wave6-cli`,
  base `1e299a7`). NEVER run scaffold/E2E from `/mnt/c` (DrvFS breaks the runtime scaffold).
- **Per-slice pace, no idling (MANDATORY):** for EACH slice — implement → run the slice's
  validation → `git commit` → `git push origin feat/package-quality-wave6-cli` → **post a
  progress comment on PR #43** (what landed, gate evidence, what's next) → IMMEDIATELY
  continue to the next slice. Do NOT stop and wait for the supervisor between slices.
- **Run to completion:** execute Slices 0, 1, 2, 3, 5 in order, end-to-end, in this one
  session. Only stop on (a) a HARD BLOCKER — a red merge gate (esp. `scaffold.runtime`
  not 41/41 in Slice 2) you cannot fix, or (b) scope exhausted (Slice 5 done). When you
  stop, post a final PR #43 comment stating exactly which slices landed (with commit
  SHAs + gate evidence) and any blocker.
- **Commit early / durable progress:** commit each sub-step; never hold a large uncommitted
  diff. If you approach any limit, push what you have and comment — never leave work unpushed.
- **Steering:** the supervisor will steer you (if needed) via `codex exec resume` on THIS
  session. Do not expect a second launch.
- **Line endings:** repo `.gitattributes` enforces `*.md text eol=lf`; do not introduce CRLF.

## 1. Read before coding (authoritative — do not re-derive)

In the worktree:
- `.llm/tmp/run/feat-package-quality-wave6-cli--research/plan.md` — the 7-slice plan, LD-1..LD-8,
  R-1..R-15, A6 gate set, validation plan. THIS IS YOUR SPEC.
- `…/research.md` — §A (target `src/` tree + moves), §B (standards), §C (seams), §E (scaffold
  improvements E.2.1–E.2.10), §F (metrics, V-1..V-14 with file:line). IMMUTABLE — never edit it.
- `…/plan-eval.md` — the PASS verdict + 4 non-blocking gaps (Gap #1–#4) you will clean up in Slice 0.
- `…/drift.md`, `…/worklog.md` (§Design).
- Skills: `netscript-harness`, `netscript-doctrine`, **`netscript-cli` (READ before touching
  scaffold/registry/command-tree)**, `jsr-audit` (publish-clean checks).
- Harness: `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`,
  `.llm/harness/gates/archetype-gate-matrix.md`, `.llm/harness/gates/plan-gate.md`.

## 2. Hard boundaries (FAIL if violated)

- Do NOT touch `packages/aspire/src/public/mod.ts` (owned elsewhere).
- Do NOT edit `scaffold-versions.ts` or any toolchain version pin / CI pin (LD-8 — owned by the
  upgrade run #44). This wave CONSUMES the 13.4 GA pins; it does not set them.
- Slice 5 is **VERIFY-ONLY** for the apphost shape (D-W6-1): #44/R6 already performed the Aspire
  13.4 GA AppHost migration (`apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json`).
  Do NOT re-perform it. Slice 5 only: verify inherited shape, mirror the pinned schema URL
  (V-14/R-3) to `packages/cli/assets/schema/`, wire `WithProcessCommand()` flag-OFF (LD-4).
- Keep path imports between `@netscript/*` packages (publish rewrites to `jsr:`); do NOT add
  back-compat alias shims to dodge slow-types; keep `0.0.1-alpha.0` lockstep.
- `@netscript/cli` is NOT published this wave (LD-7).

## 3. Slices to execute (in order)

### Slice 0 — Prep / hygiene (+ fold the eval's doc-gap cleanups)
1. Make `e2e/` a real workspace member IF NOT ALREADY (Gap #3: eval found `packages/cli/e2e`
   may already be in root `deno.json` `workspace`; if present, this is verify-only — confirm and
   say so in the commit). R-5 / slice 0.1.
2. Consume the `catalog:` baseline in `packages/cli/deno.json` (slice 0.2).
3. **Freshness bump (D-W6-2):** `tailwindcss` + `@tailwindcss/vite` → `^4.3.1`, `@preact/signals`
   → `2.9.2` in the catalog. `vite` stays DEBT_ACCEPTED (do not bump).
4. **Doc-gap cleanups (from plan-eval Gaps #1–#3):**
   - Gap #1: in `plan.md` §Commit Slices row 5.x, REMOVE `scaffold-files.ts` + `scaffold-aspire.ts`
     from the file-list (this wave no longer edits them); leave `assets/schema/*` + note the
     `WithProcessCommand()` flag-off seam.
   - Gap #2: in `worklog.md` §Design point 4, update LD-8 prose to the AMENDED state ("this wave
     **verifies** the inherited apphost shape rather than performing it").
   - Gap #3: in `drift.md` W-2, mark already-resolved; demote slice 0.1 to a verify-green check.
- Gate: `deno task check:packages --unstable-kv`, `deno task fmt --check`, `deno task lint`,
  `deno task publish:dry-run` (mind the documented `packages/aspire` barrel §9 false positive —
  not a CLI blocker). Commit → push → PR #43 comment.

### Slice 1 — Standards doc (parallel-class; do it here in sequence)
- Author `packages/cli/docs/standards.md` per research §B (§S.1–§S.7: command contract, typed
  error model, IO/output discipline incl. no `console.*` in domain code, naming, testing tiers,
  public-surface/doc-lint rules). Append the V-1..V-14 closing checklist (file:line from §F).
- Gate: doc-lint clean; README ≥150 LOC unaffected. Commit → push → PR #43 comment.

### Slice 2 — Command registry + DeployTargetPort (LOAD-BEARING)
- Concrete `CliCommandRegistry` over Cliffy `Command` (LD-2, concrete not generic) that REPLACES
  the hand-wired `packages/cli/src/public/features/root/public-command-tree.ts` chain — closes
  V-1 / F-CLI-27.
- `DeployTargetPort` + `DeployTargetRegistryPort` in `kernel/domain/deploy/*`; per-step writers
  under `maintainer/features/codegen/*` (LD-3, satisfies F-CLI-3). Remove the `DeployTargetKey`
  literal-union lock-in (V-9); `WindowsServiceDeployTarget` is the one concrete adapter.
- Add the 4 in-memory-port unit tests (slice 2.5) to lift `public/` test ratio.
- **MERGE GATE (HARD):** run, in the ext4 worktree:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
  Must be `E2E_EXIT=0`, `passed=41 failed=0`, `database.init` PASS. If RED and you cannot fix
  it: STOP, push your WIP, and post a blocker comment on PR #43 (do not paper over it).
- Other gates: `deno task check:packages --unstable-kv`, `lint`, `fmt --check`, layer check
  (F-CLI-3/F-CLI-4). Commit → push → PR #43 comment WITH the `E2E_EXIT=0 passed=41` evidence.

### Slice 3 — Surface moves + file splits
- Execute the bounded target-tree moves (research §A.2). Split the two 384-LOC files
  (`kernel/application/ui/registry.ts`, `kernel/application/scaffold/writers/write-app-files.ts`)
  under 500 LOC (F-1 / R-2). Enforce F-CLI-3 (no surface↔surface import) and F-CLI-4 (kernel
  never imports surfaces).
- Gate: `check:packages`, `lint` + layer check green, `fmt`, `deno task test`. If any public
  export path moved, log it in `research-realized.md` (LD-5). Commit → push → PR #43 comment.

### Slice 5 — Aspire 13.4 GA shape (VERIFY-ONLY) + schema mirror + flag-off
- VERIFY the inherited apphost shape (do NOT re-migrate). Mirror the pinned schema URL
  (`editor-config.ts` lines 42/115, V-14) to `packages/cli/assets/schema/`. Wire
  `WithProcessCommand()` behind a feature flag, DISABLED (LD-4) — seam only, no runtime commitment.
- Gate: `check:packages`, `lint`, `fmt`, and a `scaffold.runtime` rerun staying 41/41. Commit →
  push → PR #43 comment.

## 4. Out of THIS assignment (supervisor handles)
- Slice 4 (scaffold improvements vs the `scaffold.published.runtime` fixture) — blocked on Phase P
  (alpha.0 JSR publish). Do NOT attempt Slice 4.
- Slice 6 (final A6 gate sweep + `research-realized.md` + AP-1 verdict) — runs after Slice 4.
- IMPL-EVALs are separate OpenHands sessions the supervisor triggers; you do not run them.

## 5. Validation quick-reference
- `deno task check:packages --unstable-kv` (parse with `.llm/tools/parse-deno-check-errors.ts`)
- `deno task lint` · `deno task fmt --check` · `deno task test`
- `deno task publish:dry-run` · `deno task audit:critical`
- Load-bearing: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
- Never delete lock files/caches or run `deno cache --reload`. If the dev server mutates root
  `deno.lock`, restore with `git checkout -- deno.lock`. Inspect any intended lock churn vs base.

## 6. Definition of done for this assignment
Slices 0,1,2,3,5 each: landed as commit(s), pushed, with a PR #43 progress comment; Slice 2's
`scaffold.runtime` is green 41/41; gates green per slice. Final PR #43 comment summarizes all
landed slices (SHAs + gate evidence) and confirms readiness for Phase P + Slices 4/6.
