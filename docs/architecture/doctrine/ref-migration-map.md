# Doctrine Reference Migration Map

Issue #305's quick-win reconciles live checker and harness references with the current doctrine
catalog in [`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md).

The authoritative ranges are:

- Axioms: `A1` through `A14`
- Anti-patterns: `AP-1` through `AP-25`
- Universal fitness gates: `F-1` through `F-19`

## Checker ref migration

| Old ref / wording | Current ref | Notes |
| ----------------- | ----------- | ----- |
| `AP-1` for deep inheritance | `AP-5` / `F-4` | Current `AP-1` is monolithic file; inheritance-depth checks belong to multi-level base lattice and inheritance audit. |
| `AP-7/F-DOCT-4` for `utils/`, `helpers/`, `common/`, `lib`, `interfaces` folders | `AP-16` / `F-11` | Current `AP-7` is telescoping factory. Forbidden generic folders are `AP-16`; the gate is `F-11`. |
| `A7/AP-12` for handwritten `Result` / `Either` / `Option` types that do not re-export from a shared package | `A1` / `A2` / `A7` | Current `AP-12` is time/scheduling bypass. Result-style contracts may be package-local when they are documented, boundary-specific contracts. There is no shared-package re-export requirement. |
| `A8/AP-9` for file-size warnings | `AP-1` / `F-1` | Current `AP-9` is premature abstraction. Monolithic files map to `AP-1` and the file-size gate `F-1`. |
| `F-DOCT-5` for directory cardinality | `F-16` | The current universal folder-cardinality gate is `F-16`. |
| `A10/AP-22` for exported mutable module state | `AP-11` | Current `AP-22` is useless sub-barrel. Hidden globals / module-load mutable state are `AP-11`. |
| `AP-15/F-DOCT-7` for Hungarian or suffix type names | `AP-15` / `F-12` | Naming-convention lint is `F-12`. |
| `AP-19` for default exports | `F-5` / `F-6` | Current `AP-19` is permissions assumed silently. Default-export warnings are public-surface / JSR publishability findings, not an AP row. |
| `AP-23` for `any` in exported declarations | `A1` / `F-5` | Current `AP-23` is inline command body in composition. Exported `any` is a public-surface finding. |

## Harness interpretation

- Evaluators should treat `AP-*` refs according to the current catalog only.
- Historical debt entries that already use current refs remain valid.
- If an old checker ref appears in a run artifact or PR comment, translate it through this map before
  deciding whether debt is accepted, stale, or fixed.
