# Implement brief — chore/deps-hygiene (Group 2, dependency-shape tooling)

ROLE: You are the **WSL Codex implementation agent** for the NetScript `chore/deps-hygiene` run —
dependency-shape **enforcement tooling** (scanners) + `deno.json` task hygiene + a `deno bump-version`
wrapper. This is harnessed NetScript work (`use harness`). You implement; you do NOT self-certify.
A separate OpenHands qwen-3.7-max session runs IMPL-EVAL afterward (the supervisor dispatches it).

Worktree: `/home/codex/repos/netscript-deps-hygiene` (branch `chore/deps-hygiene`, off
`release/jsr-readiness`). Run dir: `.llm/tmp/run/chore-deps-hygiene--deps/`.

## Pre-flight (do first, in order)

1. `cd /home/codex/repos/netscript-deps-hygiene`
2. `git fetch origin && git reset --hard origin/chore/deps-hygiene && git status --short --branch`
   — must be clean and up to date with `origin/chore/deps-hygiene`.
3. Read, in order:
   - `AGENTS.md`
   - `.agents/skills/netscript-harness/SKILL.md`
   - `.agents/skills/netscript-deno-toolchain/SKILL.md`
   - `.agents/skills/netscript-tools/SKILL.md`
   - `.agents/skills/codex-wsl-remote/SKILL.md` (native-worktree rule: gates from this ext4 path,
     never `/mnt/c`)
   - run artifacts: `.llm/tmp/run/chore-deps-hygiene--deps/research.md`, `plan.md`, `worklog.md`
     (especially `## Design`), and `plan-eval.md` (the PLAN-EVAL **PASS** + the D-2 NIT).

## Task

Implement the 6 deliverables in order, one slice = one commit:
- **D-1** catalog + `deno task` census (establish the empirical baseline before scanners decide what
  is "stale"/"divergent").
- **D-2** npm catalog-compliance scanner.
- **D-3** JSR-version centralization scanner.
- **D-4** `file:`/`link:` audit.
- **D-5** `deno task` prune.
- **D-6** `deno bump-version` wrapper.

Every scanner lands **report-only first** (exit 0); a later slice flips it to FAIL-on-violation and
wires it into `ci` + `arch:check`. Never batch slices.

## Hard constraints (a violation is a process failure)

- **NEVER** de-catalog, edit a version pin, touch `scaffold-versions.ts`, or add a release-time
  `deno.json` transform. A divergence is fixed by **converging versions** OR an **explicit allow-list
  + arch-debt entry** — never by relaxing the catalog law.
- Catalog law: npm deps via `catalog:` (resolved against the root `deno.json` `catalog` block), JSR
  deps inline `jsr:` per member (Deno has no JSR catalog).
- Do NOT upgrade any dependency version (this is hygiene + tooling, NOT an upgrade run).
- Do NOT delete lock files or caches; do NOT run `deno cache --reload`.
- **D-2 NIT (from PLAN-EVAL — required):** the npm-compliance scanner MUST anchor detection on real
  `import`/`export … from "npm:…"` statements and the `imports`/`scopes` keys of `deno.json` — NOT
  substring `npm:` in arbitrary string literals. Explicitly allow-list these known non-import
  string-literal sites: `packages/cli/src/kernel/constants/windows.ts`
  (`DEFAULT_BUNDLE_EXTERNAL_IMPORTS` bundle-external map) and `packages/fresh-ui/registry.manifest.ts`
  (user-facing `dependencies` array). Document the allow-list in the scanner.
- Scanners live under `.llm/tools/deps/`, sibling contract to `.llm/tools/fitness/check-doctrine.ts`:
  emit `Finding[]` `{ ref, level, message, path, line }` + `--json` + non-zero exit on FAIL; pure
  analysis core behind a thin CLI shell.
- The bespoke bump tool: locate it first (research indicates the wrapper is greenfield; if a bespoke
  tool exists, wrap + replace it preserving structured output, with a parity test).

## Gates (per slice; native ext4 only)

- **Gate-0 (before edits):** confirm member `catalog:` refs resolve on Deno 2.8.3
  (`deno task deps:prod-install` or a member resolve check).
- New scripts: scoped check/lint (`.llm/tools/run-deno-check.ts` / `run-deno-lint.ts` with
  `--ext ts,tsx`).
- Each scanner's own `--json` run on the current tree (report-only) — expect known findings, e.g.
  the inline pin `packages/queue/adapters/amqp.adapter.ts:10` (`npm:amqplib@^0.10.3`) vs catalog
  `amqplib ^2.0.1`; JSR-centralization is currently clean (zero findings); `file:`/`link:` audit is
  currently clean (zero findings).
- After wiring: `deno task arch:check` passes incl. the new gate.
- `deno task publish:dry-run` (27 units, 0 slow types) unaffected.
- D-6: bump-version wrapper parity test green.

## Per-slice loop (every slice, in order)

1. Implement the slice (single concern).
2. Run the slice's scanner/gate; confirm report-only scanners exit 0 with the expected findings.
3. Commit: message `chore(deps-hygiene): <slice-id> — <summary>`, trailer
   `Co-Authored-By: Codex <noreply@openai.com>`.
4. `git push origin chore/deps-hygiene`.
5. Append the commit to `.llm/tmp/run/chore-deps-hygiene--deps/commits.md` (`- <sha>: <msg>`) and add
   a `## Gate Results` row in `worklog.md` with evidence. Commit + push these bookkeeping updates.

## Reporting / stop conditions

- Keep `worklog.md` current; record any drift in `drift.md` first, before adapting. If a divergence
  is found but deferred, record it as an arch-debt entry with the convergence target (per the plan's
  Arch-Debt Implications).
- You have NO `gh` auth — do NOT attempt PR comments. Just push + maintain `commits.md`; the
  supervisor mirrors slice progress to PR #55 via the PAT.
- If you hit **two consecutive gate failures on the same slice**, or anything needing a scope/catalog
  decision, record it in `drift.md` and STOP for supervisor steering (`codex exec resume`). If you
  ever feel pressure to de-catalog / edit a pin to satisfy a scanner — STOP immediately and escalate;
  that is forbidden. Do NOT self-certify or open/merge anything.
- When all slices are done and `git status` is clean, write a `worklog.md` handoff summary and STOP.
