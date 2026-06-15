# Drift log — Wave 6 `@netscript/cli` A6-v2 promotion

Reality vs RFC/doctrine assumptions (from research):

| ID | Assumption | Reality | Impact |
| -- | ---------- | ------- | ------ |
| W-1 | CLI needs a full rewrite to reach A6-v2. | Already A6-correct shape; bounded moves only. | AP-1 closes as a 7-slice program, not a rewrite. |
| W-2 | `e2e/` is a workspace member. | It is **not** (R-5). | One-line root `deno.json` fix in slice 0.1. |
| W-3 | `DeployTargetKey` is already a port. | It is a literal-union lock-in (V-9). | `DeployTargetPort` in slice 2. |
| W-4 | Aspire 13.4 native Deno apphost is released. | Not at research time; bump deferred to slice 5, consuming Phase A pins. | Slice 5 gated on upgrade-run GA status (LD-6). |
| W-5 | Root `deno publish --dry-run` failure is a CLI bug. | Upstream `packages/aspire` barrel false-positive (R-1); fixed in Phase T (T0). | Not a CLI blocker. |

## Plan-phase drift (this session)

- The 5 maintainer open questions are carried with safe defaults (plan §Open-Decision Sweep); only Q2
  (`DeployTargetKey`→port timing) is "must resolve now" and is resolved to slice 2. No deferral forces
  rework.

## Watch items (impl phase logs here)

- Aspire 13.4 preview vs GA at slice 5 (consume coupled fallback if preview).
- Any target-tree move changing a public export path.
- Impl-vs-research divergence → `research-realized.md` (LD-5), never edit `research.md`.
