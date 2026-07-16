use harness

# Slice — `.llm/tools/canvas-shots/`: a Deno screenshot tool for Claude Design prototypes

## SKILL

Activate all of these — under-listing is the failure mode:

- **`netscript-harness`** — run artifacts, drift recording. This tool exists to serve supervisor
  verification of canvas output.
- **`netscript-tools`** — where harness/agent utilities live (`.llm/tools/`) vs product-facing repo
  tooling (`tools/`), the scoped check/lint/fmt wrappers, and what counts as gate evidence.
- **`netscript-deno-toolchain`** — **read this before you touch dependencies.** `deno add`,
  `deno info`, npm-specifier semantics. Do **not** hand-roll registry curls or invent a version.
- **`playwright-cli`** — browser automation semantics (waits, contexts, screenshots).
- **`deno-fresh`** — only for context on what the rendered prototype is (Preact-authored components,
  React-shimmed on the canvas).
- **`rtk`** — prefix read-heavy `git`/`grep`/`ls`; wrap `deno task` runs in `rtk proxy`.
- **`codex-wsl-remote`** — you are a mobile-visible daemon-attached session.

Read `AGENTS.md` first.

## Why this exists

The beta.10 orchestrator must screenshot every new screen of the Claude Design dashboard prototype —
per route, in **both themes** — to review canvas output against the locked IA and to show the owner
progress. Today that is a scratch Node script. It should be a **first-class, reusable Deno tool** in
`.llm/tools/`, because this need recurs for every design pass and every future prototype.

It is a **harness/agent utility** (it verifies agent output), so it belongs in `.llm/tools/`, not
`tools/`.

## What to build

`.llm/tools/canvas-shots/` with a `mod.ts` entry point and a `deno task canvas:shots` wired in the
root `deno.json`.

### Behaviour

```
deno task canvas:shots --serve-url <url> --out <dir> [--routes a,b,c] [--themes light,dark]
                       [--viewport 1440x900] [--scale 2] [--settle-ms 2500] [--json|--pretty]
```

1. Launches Chromium via Playwright and screenshots each `route × theme` combination.
2. **Theme is applied the NS One way**: light is the *unthemed default*; dark is
   `document.documentElement.setAttribute('data-theme','dark')`. Set `colorScheme` on the context
   *and* the `data-theme` attribute — do not rely on `prefers-color-scheme` alone.
3. Routes are hash routes (`<serve_url>#<route>`); an empty route is the home screen.
4. **Captures a render verdict per shot, not just a PNG.** This is the point of the tool — a
   screenshot that renders nothing still writes a valid PNG. Each result must report:
   - `windowNSOne: boolean` — is `window.NSOne` defined? (The NS One runtime contract: `_ns_runtime.js`
     exposes `window.React`/`window.ReactDOM`/`window.NSOne`. `_ds_bundle.js` is platform-reserved and
     sets **no** globals — see drift **D-2**.) A `false` here means the prototype is not wired to the
     design system, whatever the picture looks like.
   - `consoleErrors: string[]` — deduped.
   - `failedRequests: string[]` — 404'd subresources.
   - `unresolvedHoles: string[]` — **occurrences of `{{ … }}` surviving into the rendered DOM.**
     A design-component template hole that reaches the DOM is a defect (it means a `{{ }}` landed in an
     attribute the runtime never filled). Scan `document.documentElement.outerHTML` for `{{`.
5. **Non-zero exit when a shot is defective** (`windowNSOne === false`, any console error, any
   unresolved hole, any failed request) unless `--allow-defects` is passed. A screenshot tool that
   always exits 0 is a tool that lets broken screens through review.

### Browser resolution

Playwright's bundled-browser version must match the installed browser build, and on this machine it
does **not** by default (cached `chromium-1232`, npm `playwright@1.61.1` wants `1228`). Resolve the
executable robustly:

1. `CANVAS_SHOTS_CHROMIUM` env var if set;
2. else the newest `chromium-*/chrome-linux64/chrome` under `~/.cache/ms-playwright/`;
3. else fall back to Playwright's own resolution and, on failure, emit a clear, actionable error
   naming the mismatch and the fix — **do not** silently download a browser.

Pin the Playwright version through the canonical config (see `netscript-deno-toolchain`); do not
hardcode a version literal outside the place versions live.

## Validation

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/canvas-shots --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root .llm/tools/canvas-shots --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root .llm/tools/canvas-shots --ext ts
deno test .llm/tools/canvas-shots/
```

Unit-test the **pure** parts without a browser: arg parsing, route→filename slugging, the theme-apply
script string, the defect classifier (given a synthetic result, does it exit non-zero?), and the
browser-path resolver (against a temp dir). Do not require network or a live canvas in tests.

## Rules

- **Do not make improvements outside this brief. If you see one, report it — do not implement it.**
  (A prior slice on this run made every gate green while writing literal NUL bytes into a `.ts` file,
  because it "improved" a hash separator nobody asked for.)
- **`.llm/tools/canvas-shots/` + the `deno.json` task line ONLY.** No `packages/`/`plugins/` source.
  Do not touch anything under `.llm/runs/` except appending to `drift.md`.
- **A `serve_url` is a secret.** It is a `*.claudeusercontent.com` URL carrying a project-scoped token
  and it expires. Never log it in full, never write it to a file, never bake one into a test fixture.
  Redact it in any output.
- No lock-file deletion; no `deno cache --reload` without approval.
- **Do not open a PR, do not merge.** Commit on your branch, push only via explicit refspec, report
  back. You do not self-certify.

## Report back

The task invocation, the defect classifier's exit-code behaviour, how you resolved the Chromium
version mismatch, your test list, and validation results.
