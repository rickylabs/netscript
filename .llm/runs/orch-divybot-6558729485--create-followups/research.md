# Research

Baseline `125c26fc` contains S7 phase 1. Live #2569 has no triage comment; no duplicate PR was found.

- `builder.ts` statically imports the CLI codec and Zod, and fetches the complete catalog.
- `preview.tsx` fetches the same catalog; generated examples import every component, including syntax highlighting.
- The full catalog includes documentation props/contracts not needed by the browser. Runtime needs only preset identity and five effective token values.
- Deno 2.9.7 is installed and supports browser code splitting. Existing site uses static assets and a base-path-aware preview iframe.
- Component routing uses generic UI words then matches short names. It misses identity-only questions while broad contexts can capture generic concepts.
- Existing component CSS budget is in `packages/fresh-ui/tests/publish-size.test.ts`.
- CLI `UiPreset` supports theme/style/font/iconLibrary; menu style has no independent field. Builder supports fixed presets and Utility only; arbitrary fonts/icons are intentionally rejected.
- Prior memory: carrier generators must run in order; assets check compares git diff, so commit generated outputs before that check. Preserve lockfiles.
