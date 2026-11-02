# Real scaffold browser proof — 2026-11-01

Maintainer init refuses targets outside the monorepo. The working command is:

`deno run -A packages/cli/bin/netscript-dev.ts init utility-baseline --path .llm/tmp/scaffold-2570 --app-name web --db none --no-aspire --no-git --editor none --ci --yes --json`

Then `deno task --cwd .llm/tmp/scaffold-2570/utility-baseline/apps/web dev` runs
closure/materialization checks and starts Vite. Read its reported Local URL;
do not invent a port. Browser tools are pinned in `tools/fresh-ui-browser`;
`npm ci --ignore-scripts` installs them. Reuse the host's project-managed Chromium
shared libraries for Node only. Current theme toggles `data-scheme`, not
`data-theme` (older memory predates tokens v2); storage key remains `ns-theme`.
