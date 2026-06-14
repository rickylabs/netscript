# Slice 13 - Scaffold fresh-ui Install Smoke

Date: 2026-06-12

## Command

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init slice13-ui `
  --path .llm/tmp/scaffold-smoke-slice13 `
  --db none `
  --ci --yes --no-git --force --no-aspire
```

## Result

- Exit code: 0
- Created: 93 files, 17 directories
- Maintainer local-copy phase: copied 21 local packages

## Registry Install Assertions

The generated app at `.llm/tmp/scaffold-smoke-slice13/slice13-ui/apps/dashboard` had:

| Assertion | Result |
| --- | --- |
| `islands/ui/ThemeToggle.tsx` exists | PASS |
| old `islands/ThemeToggle.tsx` absent | PASS |
| old `assets/components/actions.css` absent | PASS |
| `assets/ui/floating.css` exists | PASS |
| `assets/theme-bridge.css` exists | PASS |
| `components/ui/responsive-table.tsx` exists | PASS |
| `components/ui/control-props.ts` exists | PASS |
| `deno.json` includes `clsx` and `tailwind-merge` imports merged by ui installer | PASS |
| `assets/styles.css` contains the ui installer per-item import block | PASS |

## Generated App Check

```powershell
Push-Location .llm/tmp/scaffold-smoke-slice13/slice13-ui
deno check --unstable-kv apps/dashboard
Pop-Location
```

- Exit code: 0
- Important checked files included copied registry UI, `components/ui/mod.ts`, `islands/ui/*`,
  `lib/cn.ts`, `lib/public-types.ts`, and scaffold app routes.

## Cleanup

The throwaway `.llm/tmp/scaffold-smoke-slice13` directory was removed after evidence capture.
