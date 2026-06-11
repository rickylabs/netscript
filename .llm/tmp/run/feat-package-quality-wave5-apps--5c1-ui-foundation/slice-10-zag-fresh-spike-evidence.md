# Slice 10 Zag x Fresh Spike Evidence

## Hosting

- Scratch app:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike/`
- Reason: the planned playground app is outside this framework worktree, and no
  local shipped Fresh app harness exists in this branch.
- Shipped code: none.

## API Probe

- Command: `deno task check`
- Workdir:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike`
- Result: PASS, exit 0.
- Scope: `main.tsx`, `client.ts`, `vite.config.ts`, `routes/**/*.tsx`,
  `islands/**/*.tsx`.
- Zag API used: `combobox.collection`, `combobox.machine`, `combobox.connect`,
  `@zag-js/preact` `useMachine`, and `normalizeProps`.

## SSR Probe

- Command: `deno run -A --no-lock main.tsx`
- URL: `http://127.0.0.1:8071/`
- Result: PASS, HTTP 200.
- Captured HTML: `slice-10-ssr.html`
- Summary: `slice-10-ssr-summary.json`
- Checks:
  - `containsSsrMarker`: true
  - `containsZagScope`: true
  - `containsSelectedCity`: true
  - `containsHydrationScript`: false

## Hydration Probe

- Command attempted:
  `deno run -A --no-lock npm:vite@7.3.5 --host 127.0.0.1 --port 8071`
- Workdir:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike`
- Result: FAIL before page serve.
- Log: `slice-10-dev-server.stderr.log`
- Blocking error:
  `TypeError: Cannot read properties of undefined (reading 'unref')` from
  `esbuild@0.27.7` while Vite loads `vite.config.ts`.

## Decision

- Tier Z package work is no-go for shipping in this run.
- Evidence supports continuing only with non-shipped documentation of the spike
  and a follow-up builder-backed Fresh hydration proof in a reachable app
  environment.
