# Breaking-Change Policy

> How NetScript handles API changes, deprecations, and migrations during alpha→beta→stable.

## Alpha Instability Contract

**0.0.1-alpha.0 through 0.0.1-alpha.N are UNSTABLE.**

- APIs can and will change based on community feedback.
- No semver guarantees: a minor alpha bump CAN break previous alpha consumers.
- Package README must declare: "Alpha: API unstable, subject to change before beta."
- `docs/architecture.md` must declare archetype + "Alpha status" call-out.

**Consumer expectation:** If you depend on `@netscript/*@0.0.1-alpha.N`, you MUST read release notes before upgrading.

## Changelog Format

Every release (alpha, beta, stable) MUST include `CHANGELOG.md` at repo root with:

```markdown
# Changelog

## [0.0.1-alpha.1] - 2026-05-XX

### Added
- `@netscript/kv`: New Redis adapter support

### Changed
- `@netscript/workers`: Supervision contract clarified (**BREAKING** for direct subclassers)

### Deprecated
- `@netscript/shared`: `utils/datetime.ts` → use `@std/datetime` (removal in beta)

### Fixed
- `@netscript/cli`: Pipeline slice 4 dry-run now passes

### Migration Notes
- See `migration/0.0.1-alpha.1.md` for upgrade steps
```

**Rules:**
- Use semantic categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Mark breaking changes with **(BREAKING)** prefix
- Link to migration notes when deprecation period starts

## Migration Notes Format

When a breaking change or deprecation is announced, create `migration/<version>.md`:

```markdown
# Migration: 0.0.1-alpha.0 → 0.0.1-alpha.1

## Breaking Changes

### `@netscript/workers`: Supervision contract changed

**Old (alpha.0):**
```ts
class MyWorker extends BaseWorkers { execute(payload) { ... } }
```

**New (alpha.1):**
```ts
class MyWorker extends BaseWorkers<MyPayload> {
  protected execute(payload: MyPayload, ctx: ExecutionContext) { ... }
}
```

**Migration steps:**
1. Add generic type parameter to your subclass
2. Update `execute` signature to include `ctx: ExecutionContext`
3. Run `deno check --unstable-kv` to verify
```

## Deprecation Policy

### Forbidden folder/naming changes (e.g., `utils/` → `domain/`)

**Policy:** Hard cutover at beta release.
- Alpha: Old imports still work (no deprecation warning yet)
- Beta: Old imports emit deprecation warning via JSDoc `@deprecated`
- Stable: Old imports removed

**Example:** `@netscript/shared/utils/datetime.ts`:
- Alpha.0: File exists, re-exports `@std/datetime`
- Beta: File marked `@deprecated Use @std/datetime directly`
- Stable: File removed, import fails with clear error

### API surface changes (e.g., function rename `getWorkers` → `resolveWorkers`)

**Policy:** 2-phase deprecation for non-trivial renames:
1. **Alpha.N:** Add new API, old API marked `@deprecated`
2. **Beta:** Old API emits runtime warning (if called)
3. **Stable:** Old API removed

**Escape hatch:** For urgent security fixes, maintainers MAY remove API in alpha.N+1 without full deprecation cycle.

## Hard Cutover Policy (beta → stable)

At beta release:
- All `@deprecated` APIs from alpha MUST have migration notes
- All forbidden folders (utils/, helpers/, etc.) MUST be removed
- `docs/architecture.md` in each package MUST declare "Beta: API stable, minor changes only"

At stable (1.0.0):
- No `@deprecated` APIs remain
- No forbidden patterns in published surface
- JSR doc score = 100 for all packages

## Old Imports / Renamed Folders Handling

### Import path changes (e.g., `@netscript/shared/utils` → `@netscript/shared/domain`)

**Alpha:** Update `plan_<pkg>.md` with target import path. No runtime warning.
**Beta:** Add JSDoc `@deprecated` to old barrel re-exports (if kept).
**Stable:** Remove old barrels. Consumer gets clear error: "Moved to @netscript/shared/domain".

### Forbidden folder removal (e.g., `utils/`, `helpers/`, `interfaces/`)

**Alpha:** Keep old folder with re-exports to new location.
**Beta:** Mark old folder's `mod.ts` with `@deprecated`.
**Stable:** Delete old folder. Consumers get clear error: "utils/ removed. Use domain/ instead."

## Cross-Links

- Release process: [`release/RELEASE-PIPELINE.md`](./RELEASE-PIPELINE.md)
- Dependency ordering: [`release/DEPENDENCY-ORDERING.md`](./DEPENDENCY-ORDERING.md)
- PR #84 compatibility: [`harmonisation/PR84-COMPATIBILITY.md`](./harmonisation/PR84-COMPATIBILITY.md)
- Per-package plans: [`plan_<pkg>.md`](./plan_<pkg>.md) §"Slice list"

---

*This policy applies to alpha.0 through stable. When in doubt, favor clear consumer communication over convenience.*
