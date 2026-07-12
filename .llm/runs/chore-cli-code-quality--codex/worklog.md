# CLI code-quality remediation worklog

## Identity and plan

- Branch: `chore/cli-code-quality-typed-commands-ci`
- Required base: `b400209c`; preflight merge-base: `b400209c61ae307798bfc5083af5dcae0e7a40e6`
- Preserved orchestrator commit: `68cd9130`
- Lane: WSL Codex implementation, GPT-5.6 Sol medium; PLAN-EVAL owner-waived in the slice brief.
- Archetype: 6 (CLI/tooling), with an Archetype 5 plugin contribution seam; no frontend/service overlay.

## Design checkpoint

1. Treat Cliffy command assembly as a presentation boundary. `CliffyCommand` is the single kernel
   type and derives Cliffy's own fully-built command type through `Command['cmd']`; concrete
   builders keep their inferred options and arguments without repo-owned `any` parameters.
2. Plugin identity remains plugin-owned. Runtime manifests declare contributed doctor checks;
   static installer manifests declare scaffold capabilities before plugin code executes. Generic
   host code consumes those flags and never compares plugin names.
3. The scanner is line-oriented and conservative, excludes tests/generated source, emits structured
   JSON, supports exact `--changed-file` inputs for PRs and repository roots for audits, and permits
   only line-local `quality-allow` markers with a nonempty reason.
4. Commit slices: typed commands; capability seam; scanner/CI; gates/evidence. No `deno.lock` change.

## RED to GREEN evidence

| State | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| RED base | scanner from current tree run in detached `b400209c` worktree with `--root packages/cli/src --root plugins` | 1 | 131 findings; included 3 `plugin-name-check`, explicit Cliffy `any`/ignore findings, and unsafe casts |
| GREEN working tree | `deno task quality:scan:repo --pretty` | 0 | `ok: true`, zero findings |
| Scanner tests | `deno test --allow-read --allow-write .llm/tools/quality/scan-code-quality_test.ts` | 0 | 2 passed, 0 failed |

## Findings and scope

- Cliffy's published `Command` implementation intentionally exposes a type-erased built-command
  property. Deriving `Command['cmd']` is the one typed composition seam and avoids duplicating its
  eight compatibility generics.
- Pre-existing non-command casts in CLI public adapter compatibility and plugin stream/KV adapters
  are outside this remediation scope. Each retained cast now carries a line-local `quality-allow`
  reason; there are no file-wide or rule-wide bypasses. Follow-up should remove them when the
  independently resolved upstream generic types converge.
- No irreducible explicit `any` remains in the scanned production surface. No new
  `deno-lint-ignore` was added.

## Gate evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| Targeted scanner + install/auth command tests | 0 | 13 tests / 19 steps passed |
| Scoped check wrapper, seven touched roots | 0 | 1,129 files, 10 batches, 0 findings |
| Scoped lint wrapper, seven touched roots | 0 | 1,129 files, 6 batches, 0 findings |
| Scoped fmt wrapper, seven touched roots | 0 | 1,129 files, 6 batches, 0 findings |
| `deno task quality:scan:repo --pretty` | 0 | zero findings |
| `deno task arch:check` | 0 | all doctrine checks completed; pre-existing warnings only, no FAIL |
| `deno task doc:lint --root packages/cli --pretty` | 0 | zero diagnostics |
| `deno doc --lint packages/plugin/src/config/mod.ts packages/plugin/src/protocol/mod.ts` | 0 | touched plugin entrypoints clean |
| `deno publish --dry-run --allow-dirty` in `packages/cli` | 0 | success; no slow-type allowance |
| same in `packages/plugin` | 0 | success; no slow-type allowance |
| same in `plugins/auth` | 0 | success; no slow-type allowance |

Full historical `doc:lint` remains red in `packages/plugin` (13 private-type-ref diagnostics in
untouched contract-base/service files), `plugins/auth` (2 upstream auth-contract diagnostics), and
`plugins/ai` (16 pre-existing diagnostics). CI runs the clean CLI export map plus every public
type entrypoint changed by this slice (`packages/plugin` config/protocol). The auth change is
manifest data rather than a new exported type and its no-slow-types dry-run is green; its unrelated
doc-lint baseline is not misreported as slice regression. `arch:check` similarly reports
pre-existing warnings but exits 0. No
`scaffold.runtime` was run, by owner instruction.

## Evaluation

Separate-session IMPL-EVAL returned **PASS** at `58861a84` after independently rerunning the scanner,
scanner tests, exact CI documentation sequence, diff/lock checks, and reviewing both typed seams.

## Adversarial hardening pass (orchestrator-applied; delegation launcher aborted 4×)

The GPT-5.6 Sol-low adversarial delegation could not be launched (repeated app-server
launcher-abort + multi-agent-subagent restriction). The hardening is all tooling/harness (in the
orchestrator lane, no packages/plugins framework source), so it was applied directly; the OpenHands
IMPL-EVAL provides the independent open-model adversarial check on the whole PR.

Attacks probed → outcome:
1. Agentic-run enforcement was PROSE-ONLY → added `deno task quality:gate` (quality:scan +
   arch:check); referenced as the REQUIRED framework-wave gate in tooling.md + netscript-tools
   skill (mirror regenerated, sync check OK). An agent running the standard gate now hits the scanner.
2. `deno-lint-ignore-file no-explicit-any` (file-wide) → CAUGHT (regex already `(?:-file)?`); test added.
3. `as   unknown   as` irregular whitespace → CAUGHT (`\s+`); test added.
4. Predicate name checks `.startsWith('auth')`/`.includes('ai')`/`.endsWith('workers')` in
   features/plugins → previously BYPASSED equality-only rule; tightened `ruleFor` to also match
   string predicates on a complete quoted plugin name; 3-hit test added.
5. False-positive guard: `'auth-backend'` capability id must NOT match the `auth` plugin name →
   verified (closing-quote required); test added.
6. `quality-allow` abuse → added `allowCount` + full `allowances` (file/line/reason) to the JSON
   summary and a `--max-allow <n>` ceiling; an allowance on a clean line is not counted. Current
   CLI/plugin surface: 19 reasoned allowances (invariant durable-stream generics, Prisma-extension
   type erasure, facade re-export bridging) — all specific and auditable, bounded via --max-allow 25.
7. CI coverage: PR job scans changed files (blocking); added push-to-main + weekly schedule
   `code-quality-repo` job running quality:scan:repo (observational until #746 baseline epic closes,
   then flip continue-on-error:false). PR gate is NOT continue-on-error (hard-blocking).

Final: scanner tests 4/4; quality:gate green (0 findings, allowCount 19 ≤ 25); scanner scoped check
0; fmt clean; mirror sync OK.
