# [devtools W2-a] Transactional replace-set registry generator

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W2-a] Transactional replace-set generator`

| Field | Value |
| --- | --- |
| Labels | `type:feat`, `area:cli`, `priority:p1`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live.

Part of #<epic>

## Context

Locked decision **L12** (RFC-0002 §10) makes registry writes **transactional**: stage →
`deno check` a `*.check.ts` importing every referenced module → atomic swap or rollback, with
deterministic empty emissions. `plan.md` records that this is argued from a **shipped defect class**
— non-transactional per-target writes, existence-only verification, two divergent generators, a
regex "AstExtractor", and registries leaking on remove — not from deference to #890. Per RFC-0002
§13.1, emission is generator behavior and therefore lives in `packages/cli` (**Archetype 6**), not
in a new runtime package.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- `packages/cli/src/public/features/generate/devtools/` (new)

Introduces (verbatim): staged→`deno check`→atomic-swap emission; deterministic empty set.

## Out of scope

- Doctor wiring and the five-state quarantine taxonomy — W2-b.
- The generated DevTools host root and templates — W3-a.
- Rewriting or unifying the two pre-existing divergent generators; this slice adds the DevTools
  emitter beside them (the existing generators' debt is recorded, not fixed here).
- Deepening `@netscript/cli`'s existing **Restructure** verdict (RFC-0002 §13.1 "Must not").

## Acceptance

- [ ] `packages/cli/src/public/features/generate/devtools/` emits the DevTools registry by
      staging output, `deno check`-ing a generated `*.check.ts` that imports **every** referenced
      module, then atomically swapping or rolling back (**L12**, RFC-0002 §10).
- [ ] Test: killing the process mid-generation leaves **no partial registry** (RFC-0002 §14 proving
      gate, verbatim).
- [ ] Test: regenerating with unchanged inputs produces a byte-identical result and **skips** the
      write (RFC-0002 §14, verbatim).
- [ ] Test: removing the last contribution produces an **empty emission with no dangling import**
      (RFC-0002 §14, verbatim) — the registry-leak-on-remove defect class.
- [ ] Out-of-range `order` is rejected as a **generate-time error** (**L6**, RFC-0002 §6).
- [ ] `deno task check`, `deno task test`, `deno task quality:scan`, and `deno task arch:check`
      exit 0 for `packages/cli`; gates **F-2 (helper reinvention)**, **F-3 (layering)**, and
      **F-4 (inheritance)** are evidenced via `check-doctrine.ts --root packages/cli`
      (RFC-0002 §13.3, A6 row).

## Dependencies

- Depends on: **W1-a**, **W1-c** (RFC-0002 §14 dependency column), and **W1-d** (RFC-0002 §14 DAG
  edge `W1d --> W2a`) — which is itself blocked on owner fork **F-3**.
- Blocks: **W2-b**, and transitively W3-a.
