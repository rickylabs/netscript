# `.llm/tools/` folder cleanup playbook

Operational spec for making one `.llm/tools/<folder>/` suite production-grade. Derived from the
`.llm/tools/agentic/` cleanup (PR #592). Apply it verbatim to any sibling folder. This is a
checklist, not a narrative — execute the phases in order, honor every guardrail, pass every gate.

## 0. Scope and guardrails (read first, non-negotiable)

- **Target:** exactly one folder under `.llm/tools/`. Do not touch `packages/`, `plugins/`, other
  `.llm/tools/` folders, or `.llm/runs/**` history (append your own run dir only).
- **No behavior change.** Structure, dead-code removal, config centralization, @std swaps, and docs
  only. Every live tool must keep identical CLI output, exit codes, flags, and safety invariants
  (secret/PII-safety, fail-closed, anchored-repair, boundary deferrals, opposite-family evaluation).
- **Prove before you cut.** No deletion or move without reference analysis (Phase 1). A file or
  symbol with ANY live reference is not dead. When unsure, keep it and record why.
- **Mirrors are generated.** `.claude/skills/**` is generated from `.agents/skills/**`. Never
  hand-edit a mirror; edit the source then run `deno task agentic:sync-claude`.
- **Lock hygiene.** Do not delete `deno.lock` or run `deno cache --reload`. The ONLY sanctioned lock
  change is adding minimal, pinned `@std/*` import-map entries (Phase 4). No non-@std third-party
  deps.
- **Process.** Commit in logical slices (inventory → moves → config → @std → docs). Push each with
  the explicit refspec `HEAD:refs/heads/<branch>`. Do NOT merge or promote.
- **Deliverable:** a run-dir `inventory.md` (Phase 1 + running log) and the final report with the
  tree, kept/moved/deleted table with justifications, gate output, and the `deno.lock` delta.

## 1. Inventory + reference analysis (do this before changing anything)

1. List every file: `ls`, and `wc -l **/*.ts | sort -n` to gauge sizes.
2. Baseline the gates (Phase 8) and record the passing counts — this is your regression anchor.
3. Build the **internal import graph**:
   `grep -rn "from '\./\|from '\.\./" <folder> --include="*.ts"`.
4. Build the **external reference set** for every file. Grep each basename across ALL of:
   - relative imports repo-wide,
   - `deno.json` tasks (and any `dependencies`/task chains),
   - `.agents/skills/**` and (mirror) `.claude/skills/**`,
   - `.llm/harness/**` docs,
   - `.claude/settings*.json` hooks,
   - `CLAUDE.md` / `AGENTS.md`,
   - `.github/workflows/**`,
   - `docs/**`. `.llm/runs/**` is surveyed for evidence but NEVER edited (stale paths there are
     acceptable).
5. Classify each file: KEEP-in-place / MOVE / DELETE. Write the disposition table to
   `.llm/runs/<run-dir>/inventory.md` with the live references that justify each row.
6. **Dead-code criteria (ALL must hold to delete):** zero imports, zero `deno.json` task, zero
   skill/harness/hook/doc/workflow reference, and no dynamic/string-path load. If a name looks stale
   (e.g. `legacy-*`, `*-compat`, `deferred-*`) but pins live behavior, KEEP it. Expect the common
   outcome to be **zero deletions** — epics usually leave a flat layout, not dead files.
7. Commit slice 1: the inventory doc alone.

## 2. Concern-folder taxonomy (the restructure)

Derive folders from **concerns**, not file types. Method:

1. Cluster files by the subsystem they serve (identify the "brain"/controller vs. execution lanes
   vs. shared lib vs. human/agent CLIs vs. generated-surface tools).
2. Name each folder for its concern (e.g. `runtime/`, `codex/`, `openhands/`, `github/`, `wsl/`,
   `claude/`, `lib/`, plus a `<controller>/cli/` edge for entry points over the brain).
3. **Preserve file names** (no renames) so history, run artifacts, and grep memory survive.
4. Move with `git mv` (keeps follow-history). Keep tests next to what they test (`*_test.ts`).
5. Keep a heavily cross-referenced internal package (e.g. the controller `runtime/`) in place; only
   add an edge subfolder for its CLIs.
6. After every move, update **every** reference found in Phase 1:
   - relative imports (cross-boundary paths change),
   - `deno.json` task paths, `.claude/settings*.json` hook commands,
   - in-file usage strings / help text / doc-comment self-paths,
   - child-process script URLs (`new URL('../…', import.meta.url)`),
   - spawn paths inside validators,
   - skill/harness/workflow/CLAUDE/AGENTS references,
   - then regenerate mirrors: `deno task agentic:sync-claude`.
7. Update any test that asserts file paths (e.g. a deprecation-boundary guard) to the new paths —
   keep the assertions (task names, flags, delegation) unchanged.
8. Run the full gate set (Phase 8). Commit slice 2.

## 3. Central config: one source for everything volatile

Everything that changes over time gets ONE typed, documented home: `<folder>/config/`.

1. Create `config/` with a module per concern and a `mod.ts` barrel:
   - `models.ts` — model-id string constants (`MODEL_IDS`, `OPENROUTER_MODEL_IDS`). Reconcile with
     any existing routing authority (e.g. `runtime/routing-policy.ts`) so the routing array
     REFERENCES these ids — one source for the strings, one authority for the bindings.
   - `versions.ts` — tool versions, separated by kind: TARGET (bump on upgrade), COMPAT (frozen
     verification markers), TEST (test-only expected values).
   - `endpoints.ts` — hosts, base URLs, installer URLs.
   - `mod.ts` — re-export barrel + a doc header naming the concern→module map.
2. **De-hardcode exhaustively.** Grep the whole folder for every volatile literal and re-point it:
   - versions: `grep -rnE "['\"][0-9]+\.[0-9]+\.[0-9]+['\"]"` (exclude `SCHEMA_VERSION`-style),
   - model ids: `grep -rnE "gpt-|fable-|opus-|claude-[a-z0-9]|minimax|glm-|grok-|sonnet|haiku"`,
   - endpoints: `grep -rnE "https://|nodejs\.org|registry\.npmjs|api\.github|\.ai/api"`. Re-export
     shims keep old export names (e.g. `export const NODE_VERSION = NODE_TARGET_VERSION`) so
     external importers do not break.
3. **Enforcement test** — `config/no-hardcoded-volatile_test.ts`. It scans all `*.ts` in the folder
   EXCEPT `config/**`, `*_test.ts`, and fixtures, and fails if any centralized literal reappears.
   Exclude overloaded tokens that are also legitimate non-config strings (e.g. a model id that is
   also a CLI executable name) — document the exclusion in the test.
4. **isolatedDeclarations rules** (the repo sets `isolatedDeclarations: true`):
   - `export const X = {…} as const;` is emittable; `Object.freeze({…} as const)` is NOT without an
     explicit type annotation — either drop the freeze or annotate.
   - You cannot reference another const inside an exported `as const` object (inline the literal,
     and note that both live in `config/` so it is still single-source).
   - Re-export shims need an explicit type (`export const X: string = CONFIG_X;`).
   - Tuples built from const refs need an explicit tuple-type annotation.
5. Preserve runtime invariants a test pins (e.g. a fixture asserted `Object.isFrozen`) — freeze at
   the consumption site with its existing explicit annotation.
6. The one value a task-string `--allow-net=` allowlist in `deno.json` can't read from a const:
   document it in `config/endpoints.ts` and keep it in sync manually.
7. Run gates. Commit slice 3.

## 4. @std / Deno-native-first pass (AGENTS.md rule 3)

Default to Web Platform APIs, `Deno.*`, and `@std/*` before any local abstraction. Authorized: add
minimal, pinned `@std/*` entries to the root `deno.json` `imports` and accept the resulting
`deno.lock` delta. NO non-@std third-party deps.

1. Audit for hand-rolled equivalents of what `@std` ships:
   - per-test-file local `assert`/`assertEquals`/`equal`/`assertThrows` → `@std/assert`,
   - hand-rolled `dirname`/`basename`/`join`/path splitting → `@std/path`,
   - manual dir recursion → `@std/fs` (`walk`), arg parsing → `@std/cli` (see caveat),
   - hex/base64 → `@std/encoding`, color/format → `@std/fmt`.
2. Add only the entries you use, pinned to the major already in `deno.lock`
   (`grep -oE "@std/[a-z-]+@[0-9.]+" deno.lock | sort -u`), e.g.
   `"@std/assert": "jsr:@std/assert@1"`. On Linux, `@std/path` default = posix (no subpath entry
   needed). Reusing an already-resolved pin keeps the lock delta to workspace-dependency lines only.
3. Swap semantics carefully — `@std/assert` `assertEquals` is deep structural equality, NOT
   JSON-stringify. Two known breakages:
   - readonly const tuple vs. mutable array → spread the const operand (`[...X]`),
   - a round-trip through JSON that drops `undefined` optionals → compare against
     `JSON.parse(JSON.stringify(x))` to preserve the prior semantics exactly.
4. **Do NOT force a swap where the hand-rolled version is genuinely better.** Bespoke CLI
   pair-parsers that drive specific usage-error exit codes pinned by tests must stay — `@std/cli`
   `parseArgs` changes parsing semantics. Record the intentional keep.
5. Keep genuinely-custom helpers with no @std equivalent (e.g. an `assertUnique`).
6. Run gates (checking behavior is preserved is the whole point). Commit slice 4. Record the
   `deno.lock` delta.

## 5. Harmonization / consistency standards

Make the feature modules coherent WITHOUT reshaping contracts that tests pin.

- **Doctrine:** identify the archetype (internal CLI/tooling = Archetype 6). Contract-first:
  schema/types → implementation → tests. Impure code (`Deno.env`, `Deno.Command`) lives ONLY in
  `adapters/**`; pure planners/policies are value-in/value-out.
- **Naming:** one vocabulary across modules — shared `contract.ts` for agent/provider/effort enums,
  diagnostic codes, and `EXIT_CODES`.
- **Contract/ports-adapter shape:** a versioned schema, desired-vs-observed state, explicit
  read/mutation ports, a pure planner, adapters at the edges. Extend these types; don't fork a
  second controller.
- **Diagnostic pattern:** finite, typed, secret-safe result objects; owner-acceptance never converts
  a failed runtime observation into a pass.
- **Doc-header style:** every module opens with a one-paragraph purpose comment; config modules
  state the maintenance contract.
- If the modules are already contract-unified, DO NOT rewrite them — a deep refactor risks the
  invariant tests for no observable gain. Record that the pass was consistency-only.

## 6. Useless-test audit (conservative)

Remove ONLY genuinely trivial / duplicate / tautological tests. Audit every test name and the
smallest bodies.

- **NEVER delete** a test that asserts a real invariant: secret/PII-safety, fail-closed,
  no-broad-kill / anchored-repair, boundary/deferral, restart/round-trip fidelity, opposite-family
  evaluation, dated-override expiry, frozen-fixture immutability, finite/bounded edges,
  credential/prompt rejection, delegation boundaries.
- Delete only: a test that asserts a constant equals itself, exact duplicates, or a check the type
  system already guarantees.
- When in doubt, KEEP. List every deletion with a one-line reason. Net count may drop, but every
  invariant must still be covered. (In the agentic run: zero were safe to delete.)

## 7. README from scratch (house style)

Rewrite the folder `README.md` in the NetScript docs voice (study `docs/site/cli-reference.md`).

- Structure: what it is → mental model (e.g. brain vs. hands) → folder map → everyday-flow
  narratives (grouped by task, in the order things happen) → the controller → safety model →
  **Maintenance map** → env overrides → tests & validation.
- Write engineer-to-engineer prose, not a file dump. Each CLI: purpose, when to use, invocation, a
  runnable example with REAL captured output, exit codes.
- Plain GitHub-flavored markdown (the site's Vento/`{{ comp }}` components do NOT belong in a tool
  README) — mirror the voice, use `>` blockquotes for callouts.
- Include a **Maintenance map** table: the single place to change each of models / routing bindings
  / versions / endpoints / policies / agents / deps.
- Verify every task name and referenced file path exists before committing.
- Update `.agents/skills/**` sources and `.llm/harness/**` docs to point at the central config and
  the maintenance map; regenerate `.claude` mirrors. Commit slice 5.

## 8. Hard gates (must all pass before done; capture raw output)

Run scoped to the target folder. All must be green:

```bash
deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root <folder> --ext ts,tsx   # 0 findings
deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root <folder> --ext ts,tsx   # 0 findings
deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root <folder> --ext ts,tsx   # 0 findings
deno test --no-lock -A <folder>/                                                                        # 0 failed
deno task agentic:check-claude                                                                          # ok (if the folder touches the Claude surface)
deno task agentic:sync-claude:check                                                                     # clean
git diff --check                                                                                        # clean
git diff --stat deno.lock                                                                               # empty, OR only the sanctioned @std workspace-dep additions
```

Regression rule: the post-change test count must be ≥ the Phase-0 baseline minus any explicitly
listed useless-test deletions, plus any new enforcement/guard tests you added.

## 9. Commit-slice sequence (push each with the explicit refspec)

1. `chore(<folder>): inventory — reference analysis`
2. `refactor(<folder>): restructure into concern folders` (+ all reference updates + mirrors)
3. `feat(<folder>): central config + de-hardcode volatile constants` (+ enforcement test)
4. `refactor(<folder>): @std-first pass` (+ import-map/lock delta)
5. `docs(<folder>): README rewrite + maintenance map` (+ skill/harness pointers + mirrors)

Do NOT merge or promote. Report back: the tree, the kept/moved/deleted table with justifications,
the docs rewritten, raw gate output, and the `deno.lock` delta.
