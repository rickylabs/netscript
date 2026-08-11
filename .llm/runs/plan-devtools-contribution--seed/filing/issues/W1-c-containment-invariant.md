# [devtools W1-c] Containment invariant + generator scoping (INV-1 / INV-2)

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W1-c] Containment invariant + generator scoping (INV-1/INV-2)`

| Field | Value |
| --- | --- |
| Labels | `type:fix`, `area:cli`, `priority:p1`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live. `type:fix` is used because this slice
closes two live defect classes (risks **R2** and **R3** in `plan.md`), not because it adds a feature.

Part of #<epic>

## Context

`plan.md`'s risk register records **R2** — an arbitrary-write path via a contribution's filesystem
target, because `resolveTarget` has no containment assertion (inert only while first-party) — and
**R3** — the generator subprocess spawning with bare `--allow-read` / `--allow-write`, i.e.
whole-filesystem scope (drift **D-7**). RFC-0002 §9 labels both **UNPROVEN** at baseline and §15.4
confirms none of these gates exists today. This slice builds them.

Part of #<epic>

## Scope

Files / roots, verbatim from RFC-0002 §14:

- `packages/cli/src/kernel/application/ui/registry.ts`
- `.../generate/plugins/installed-runtime-registry-generator.ts`

Introduces (verbatim): a shared path-containment resolver.

## Out of scope

- The transactional replace-set emission itself — W2-a.
- The doctor five-state taxonomy — W2-b.
- Sandboxing, code signing, per-contribution RBAC, or capability grammars — all **declined** with
  their cited antecedents under **L14** (RFC-0002 §9, §12). Do not reintroduce them here.
- Any production-exclusion mechanism — W3-b.

## Acceptance

- [ ] A single shared path-containment resolver exists and is the only path-resolution entry point
      used by both files named in Scope (no second private resolver).
- [ ] **G-1** unit tests assert containment rejection for each of: `/etc/x`, `../../x`,
      `@ui/../../x`, and a symlink escape (RFC-0002 §14 proving gate, verbatim).
- [ ] **G-2** an argv test asserts the generator subprocess spawn carries **no bare**
      `--allow-read` and **no bare** `--allow-write` (RFC-0002 §14, verbatim; drift D-7).
- [ ] `deno task check` and `deno task test` scoped to `packages/cli` exit 0, with output linked in
      the PR.
- [ ] `deno task quality:scan` and `deno task arch:check` both exit 0 — a green scoped wrapper is
      explicitly **not** sufficient (RFC-0002 §13.3).
- [ ] RFC-0002 §9's UNPROVEN labels for containment (R2) and generator scoping (R3) are updated to
      cite these tests, or a follow-up issue is opened stating why not.

## Dependencies

- Depends on: **W1-a** (RFC-0002 §14).
- Blocks: **W2-a** (transactional replace-set generator).
