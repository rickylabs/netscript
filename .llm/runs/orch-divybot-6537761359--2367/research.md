# Research

- Current main and branch baseline match `4aa734e2b6ca93119462ec2e0cd34b729df51bfd`.
  Live issue #2367 has prose acceptance (no markdown acceptance boxes); no covering PR or triage
  report was found. Deliver duplicate refusal, quoting preservation, compatibility, and safe errors.
- NetScript MCP `find_guidance` then `search_docs` consulted. Public docs describe database adapter
  boundaries but no duplicate-normalization policy; local exported API inspected via `deno doc`.
- `OPTION_KEYS` already maps aliases to canonical options; `parts.set` currently overwrites them.
  Tokenizer trims and lowercases keys, supports quoted delimiters and doubled quote escapes.
- Public error exposes `reason` and lowercase `key`; messages contain only the reason. Add
  `duplicate-key` and report only a known canonical option for duplicate failures.
- SSL mode map lacks hyphenated libpq spellings; numeric port validation returns the original text.
- Existing tests explicitly expect last-wins behavior in one fixture; replace that obsolete contract.
  Some unsupported-value fixtures prepend Host then test Host; remove the accidental duplication.
- CLI assets inline the maintained normalizer/error/tokenizer into generated modules and Prisma
  config. Regenerate both tracked assets using `deno task gen:assets-barrel`; extend the existing
  generated-normalizer tests. This affects scaffold output, so coordinator-armed e2e-cli CI is required.
- Archetype 2 Integration. Existing doctrine verdict is Refactor (adapter/extension splits); this
  bounded pure-function correction does not deepen its registered AP-17 debt or add a new seam.
- JSR rubric applied: export map unchanged; explicit function/property types already exist; new
  reason extends an existing union. README and export JSDoc need updates. No slow-type carve-out
  requested. Package dry-run uses catalog-materializing root task with `--member packages/database`.
- Memory consulted: prior launch recipe confirms Claude JSON model attestation and same-session
  resume; CI requires ready PR and coordinator e2e label; public artifacts omit machine identifiers.

## Reusable memory

- RTK is absent in this environment. Invoke repo structured wrappers directly; do not fake a proxy.
- Generator source: `.llm/tools/generate-postgres-connection-template.ts`; both generated module and
  Prisma config behavior are tested in `packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts`.
- Target package publish task: `deno task publish:dry-run --member packages/database`.
- Baseline package normalizer suite: structured test wrapper, `-- --allow-all
  packages/database/tests/postgres-connection-string_test.ts`: 10 passed, exit 0.
- Root quality/architecture/dependency gate passes at bootstrap head (exit 0); existing doctrine
  warnings are non-blocking. Durable receipt retained outside the public tree.
- Git identity was not configured despite dispatch assumptions. Set repository-local identity to
  the authenticated account's verified GitHub noreply identity, matching the baseline commit.
- A public reference edit needs `gen:agent-docs-prose`, and exported JSDoc/reason changes need
  `gen:mcp-export-corpus`; `gen:assets-barrel` does not rebuild either corpus. Quality CI checks both.
  Check changed compressed rows to prove scope; canonical generation retains unchanged row bytes.
