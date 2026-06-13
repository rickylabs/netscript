# [5d5] Drift Ledger

Status: IN PROGRESS

- **D-5d5-1 — Root workspace exclusion prevents any fresh package from publishing (umbrella-level blocker)**

  `deno.json` excludes `packages/fresh/` from the root workspace:

  ```jsonc
  "exclude": [
    ".llm/tmp/",
    "packages/fresh/"
  ],
  ```

  The dry-run artifact (`dry-run-raw.txt`) reports **116** `excluded-module` errors across `packages/fresh/`, with **23** of those originating from `packages/fresh/form/*` (`schema-adapter.ts`, `field-descriptors.ts`, `types.ts`, `mod.ts`, and their downstream graph). Fixing `deno doc --lint` inside the form package does not unblock publishing because the root workspace exclude is still in force.

  This is therefore an umbrella-level risk for 5d6 / final Wave-5 close, not a 5d5 deliverable. The 5d5 implementation must stay self-contained (no workspace excludes, no lockfile changes) and record the dependency so the umbrella close can lift `packages/fresh/` from `deno.json` `exclude`.

  - Status: OPEN
  - Owner: 5d6 / umbrella final close
  - Proposed close gate: root `deno publish --dry-run` passes for `@netscript/fresh/form` after `packages/fresh/` is removed from `deno.json` `exclude`.


