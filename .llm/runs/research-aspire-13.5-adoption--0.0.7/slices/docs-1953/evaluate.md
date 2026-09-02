# Evaluation: PR #1953 docs(skills) — aspire-upgrade skill (head c231fbe5e, base 88fc6d69d)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7` (slice `docs-1953`)                   |
| Target         | PR #1953 — new `.agents/skills/aspire-upgrade/SKILL.md` + README row/routing |
| Archetype      | N/A — documentation skill, no framework source                               |
| Scope overlays | docs                                                                         |
| Evaluator      | Separate-session IMPL-EVAL, OpenRouter z-ai/glm-5.3-flash xhigh, 2026-09-03  |

## Scope confirmation

`git diff --stat 88fc6d69d..HEAD` → exactly 2 files, 180 insertions:
`.agents/skills/README.md` (+2) and `.agents/skills/aspire-upgrade/SKILL.md` (new, 178 lines).
`git diff --name-status` shows only `M` README + `A` SKILL.md — no `packages/`, `plugins/`,
`skills/`, `.claude/skills/`, generated carrier, or lockfile touched. Worktree clean at
`c231fbe5ecbf65195db68bf59c70c48dea475817`.

## Process Verification

| Check                                  | Result | Evidence                                                                               |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | N/A    | Docs PR — no PLAN-EVAL requirement (cycle-1 note treated as informational per protocol) |
| Design section exists in worklog       | N/A    | No run worklog required for a two-file docs slice                                      |
| Commit slices match design plan        | PASS   | Range 88fc6d69d..c231fbe5e = skill add + carrier-chain prose + audit repair (c231fbe5e) |
| Each slice has a passing gate          | PASS   | Hosted `quality` SUCCESS + `check-test` SUCCESS at exact head c231fbe5e (given, not rerun) |
| No speculative seams (unused files)    | N/A    | No code files added                                                                    |
| Constants used for finite vocabularies | N/A    | Markdown only                                                                          |

## Static Gates

| Gate             | Command or check                                                            | Result | Evidence                                                                                        |
| ---------------- | --------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Narrow typecheck | skipped per eval scope (no `deno task check`)                                | NOT_RUN | Docs-only; hosted `check-test` SUCCESS at head covers the suite                                  |
| Format           | `deno fmt --check .agents/skills/aspire-upgrade/SKILL.md .agents/skills/README.md` | PASS | exit 0, "Checked 2 files"                                                                       |
| Lint             | skipped per eval scope                                                       | NOT_RUN | Markdown only                                                                                   |
| Claude surface   | `deno run --allow-read --allow-env --allow-run .llm/tools/agentic/claude/validate-claude-surface.ts` | PASS | JSON `ok:true`, 6/6 checks OK (incl. "repo-skills is the only Claude skill", deno.lock unchanged) |
| Link/path check  | citation sweep over SKILL.md (see Findings)                                  | PASS w/ findings | 4 findings below; all `deno task` names, constants, workflows, fixtures resolve            |

Note on the surface validator: the eval brief's exact invocation (without `--allow-run`) died with
`NotCapable: Requires run access to …/deno` at `validate-claude-surface.ts:113` — its
`runHookLockCheck` spawns a `deno` child. Adding `--allow-run` (read from the script header) makes
it pass; the failure was sandbox permission, not a surface defect.

## Fitness Gates

F-1 … F-19: N/A — no TypeScript source in scope (markdown skill + README rows only). No package
surface, publish, or test-shape change is possible from this diff.

## Runtime Gates

| Gate                          | Validation                                             | Result | Evidence                                                                 |
| ----------------------------- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------ |
| `e2e-cli` `scaffold.runtime`  | correctly skipped — docs-only classification            | N/A    | Hosted evidence at exact head: runtime tiers skipped (given, not rerun)   |
| AppHost / Aspire start        | none attempted (eval scope forbids Aspire/Docker starts) | N/A    | No lease taken                                                            |

## Consumer Gates

| Consumer              | Validation                                                        | Result | Evidence                                                                                     |
| --------------------- | ----------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Consumer skill bundle | `agentic:dogfood-skills` NOT_RUN — no `skills/**` or carrier edit  | N/A    | `.agents/skills/**` regenerates nothing (chain verified: only `gen:assets-barrel` reads `skills/manifest.json`) |
| Claude bridge         | `.claude/skills/repo-skills/SKILL.md` untouched, still sole bridge  | PASS   | `git diff --name-status` (2 files only) + validator "Claude repository-skill bridge ok"       |

## Anti-Pattern Check

All AP-1 … AP-25: N/A — pattern surfaces (product source, plugins, carriers, tests) are untouched
by a two-file `.agents/skills/` docs diff.

## Arch-Debt Delta

| Metric                | Count | Evidence                                        |
| --------------------- | ----- | ----------------------------------------------- |
| New entries           | 0     | No `debt/arch-debt.md` change in diff            |
| Resolved entries      | 0     | —                                                |
| Deepened violations   | 0     | —                                                |
| Unrecorded violations | 0     | No framework code in scope                       |

## Citation resolution (Check 1)

Resolved (tracked at head, verified with `git ls-files --error-unmatch` / grep):

- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` — `ASPIRE_SDK` :5,
  `ASPIRE_HOSTING_DENO` :9, `ASPIRE_HOSTING_SQLITE` :10 (SKILL.md:45).
- `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` — `SCAFFOLD_ASPIRE_INTEGRATIONS`
  :9 with exactly the claimed ids (`Aspire.Hosting.{PostgreSQL,MySql,SqlServer,Redis,Garnet,Browsers}`
  + `CommunityToolkit.Aspire.Hosting.Deno`), Browsers on `13.5.3-preview.1.26425.3`, Deno toolkit
  `13.5.0` (SKILL.md:46).
- `.github/workflows/e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml` — each carries
  `dotnet tool install Aspire.Cli … --version 13.5.3`, `nuget-aspire-${{ runner.os }}-13.5.3-v1`
  cache keys, and the `13.5.*)` guard (SKILL.md:48).
- `.llm/tools/validation/check-aspire-version-parity.ts` — `PHASE_TWO_COMPAT_VERSION = '13.5.3'`
  :16; `status: deferred` and `owner` are real finding fields (:15, :21, :126) (SKILL.md:49,120-121).
- `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` and
  `…/tools/aspire-surface-manifest.ts` — tracked; the line-119 `deno run` invocation's permission
  set (`--allow-read --allow-run=git --allow-write`) is consistent with a git-driven manifest writer.
- Fixture paths (SKILL.md:74-78) all exist with `<ver>` = 13.5.3 — see Check 3.
- Generated carriers (SKILL.md:89-94): `packages/cli/src/kernel/assets/{embedded,skills,agent-docs}.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts` tracked; `skills/manifest.json` lists the
  consumer skill set; `gen:agent-docs-prose` → `prose.json.gz` + `provenance.json` →
  `agent-docs.generated.ts` → `gen:publish-assets` matches `generate-publish-assets.ts:34-39`.
- Docs-site prose rows (SKILL.md:51): `docs/site/reference/aspire/index.md`,
  `docs/site/explanation/aspire.md`, `docs/site/quickstart/aspire.md` tracked.
- All 11 cited `deno task` names resolve in root `deno.json`: `check:aspire-version-parity` :127,
  `gen:mcp-export-corpus` :120, `gen:assets-barrel` :118, `check:publish-assets` :125,
  `gen:agent-docs-prose` :123/:121, `check:agent-docs-prose`, `gen:publish-assets` :124,
  `check:assets-barrel` :122, `check:mcp-export-corpus` :121, `agentic:dogfood-skills` :81,
  `agentic:dogfood-skills:check` :82.
- CI surface (SKILL.md:127-128): `.github/workflows/ci.yml` + `e2e-cli.yml` exist;
  `agent.aspire-mcp-smoke`, `behavior.otel.traces`, `behavior.streams.producer-reconnect` defined at
  `packages/cli/e2e/src/domain/cli-surface.ts:65,176,162`; postgres + sqlite receipt dirs at
  `e2e-cli.yml:381,470` confirm the "both runtime tiers" claim.
- `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts`,
  `…/scaffold/aspire-dashboard-api.ts`, `…/scaffold/otlp-headers.ts` (SKILL.md:167-168,144) tracked.
- `skills/aspire/SKILL.md` carries 22 `S2-V`/`S9-` evidence-key mentions — the "re-verify each
  tagged evidence key" instruction (SKILL.md:125-126) is actionable. `.llm/tools/deps/` exists
  (SKILL.md:157).
- Repaired fact 1 verified: `.mise.toml` is **untracked** (`git ls-files --error-unmatch` fails);
  SKILL.md:47 states exactly that. Repaired fact 2 verified: `skills/manifest.json` +
  `skills.generated.ts`/`embedded.generated.ts` chain named, `.claude/skills/repo-skills` named as
  the single bridge with no mirrors (SKILL.md:86-88).

Unresolved / mis-attributed citations → findings F1–F3 below.

## Pin map correctness (Check 2)

Every enumerated location contains an Aspire version literal at this head (`git grep -l '13\.5\.3'`
cross-check): scaffold-versions.ts, scaffold-aspire.ts, the three workflow files, the parity
constant, and all version-suffixed fixtures. `.mise.toml` is correctly described as an external,
untracked host pin. Residual gap: two tracked literal sites exist that the table does not list —
finding F4.

## Fixture consistency (Check 3)

Fixture re-record table vs `git ls-files`:

- `packages/cli/e2e/tests/application/gates/fixtures/aspire-doctor-13.5.3.json` ✓
- `…/aspire-13.5.3-describe-postgres.json` ✓; `aspire-describe-follow-13.5.3{,-capture,-nullable-state}.ndjson` ✓
- `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` ✓
- `packages/mcp/tests/fixtures/telemetry/aspire-13.5.3-fixture.ts` (+ `README.md`, plus retained
  `aspire-13.4.6-fixture.ts` beside it, exactly as SKILL.md:80-82 requires) ✓
- `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json`, `process-tree-13.5.3-{orphaned,phase-b-live}.json` ✓

Patch/minor/major table (SKILL.md:59-68) is internally consistent with these: patch = pin sweep +
dual-tier proof + unchanged fixtures (all fixture families are version-suffixed, so a patch that
bumps literals would indeed need no re-record unless shapes moved); minor = re-record every family.
The "14 tools + `refresh_tools`" parenthetical has an off-by-one ambiguity → finding F2.

## README consistency (Check 4)

Row `| aspire-upgrade | Aspire version bumps: pin map, fixture re-record, carrier chain, runtime
proof, canary class. | active |` inserted directly beneath `aspire` in the scope table (the table is
not globally alphabetical — `jsr-audit`, `deno-fresh`, `aspire` — so adjacent-to-`aspire` placement
is consistent with neighbour grouping), and the routing line `- Taking a new Aspire release
(patch/minor/major pin bump) → \`aspire-upgrade\`` inserted directly beneath the `aspire` routing
line, matching the established `- <trigger> → \`<skill>\`` format. No other README rows disturbed.

## Doctrine/boundary (Check 6)

- No `.claude/skills/` mirror: diff touches only `.agents/skills/**`; validator confirms
  `.claude/skills/repo-skills/SKILL.md` is still the only Claude skill and still points to
  `.agents/skills`.
- No product/carrier/lockfile change: `git diff --name-status` = 2 docs files; validator's
  hook-lock check reports `deno.lock` unchanged.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium | SKILL.md:89-90 draws `gen:mcp-export-corpus` into the `skills/` → carrier chain ("`skills/` prose -> `gen:mcp-export-corpus` -> `gen:assets-barrel` …"), but that task reads only the `packages`/`plugins` documentation surfaces and emits the unrelated `export-surface-corpus.generated.ts`; the actual `skills/manifest.json` reader is `gen:assets-barrel` | `.llm/tools/docs/generate-export-surface-corpus.ts:7` (`GENERATOR_READ_SET = ['packages', 'plugins']`), header line 1, `EXPORT_SURFACE_CORPUS_OUTPUT` :13; `.llm/tools/generate-cli-assets-barrel.ts:219-226` reads `skills/manifest.json` + `skills/<files>`; `generate-publish-assets.ts:34-39` consumes the barrel outputs, not the corpus | Fix (one line): drop `gen:mcp-export-corpus` from the chain diagram — real chain is `skills/` → `gen:assets-barrel` → `gen:publish-assets` → `check:publish-assets`; it remains valid as one of the four green checks and as the parallel packages/plugins corpus lane |
| low | SKILL.md:76 records the MCP fixture as "14 tools + `refresh_tools`", implying 15; the fixture's `tools` array holds 14 entries **including** `refresh_tools`, and the canonical statement in the cited skill says 14 total | `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` `tools` array (14 names incl. `refresh_tools`); `skills/aspire/SKILL.md:212` "these 14 tools (S9-STATIC)" with `refresh_tools` in the table (:223) and :226 "the required 13.5.3 baseline is the 14 tools above" | Reword to "(14 tools incl. `refresh_tools`)" so a re-record diff does not chase a phantom 15th tool |
| low | SKILL.md:163-165 cite `.llm/runs/research-aspire-13.5-adoption--0.0.7/{research.md,plan.md,drift.md}` as "Reference Files", but those three are untracked and absent at this head; only the run's `aspire-surface-manifest.tsv`, `tools/aspire-surface-manifest.ts`, and `slices/s5/repair/*` are tracked | `git ls-files --error-unmatch` fails for all three; `test -e` absent in this checkout; `git log -- <research.md>` empty (never committed); the tracked run core does resolve | Label those rows as run-scoped evidence that may not exist in a fresh clone (or drop them); the run dir is named as the worked example at SKILL.md:20, so provenance is visible but not stated |
| low | Pin-map table header (SKILL.md:41 "every place the version literal lives") omits two tracked literal sites: `.github/toolchain.env` (`NETSCRIPT_ASPIRE_CLI_VERSION=13.5.3`, `NETSCRIPT_ASPIRE_SDK_VERSION=13.5.3` at :10-11) and `.github/scripts/aspire-nuget-cache-policy.test.ts` | `git grep -l '13\.5\.3'` (non-run, non-generated hits); both sites are enumerated by the parity gate itself at `check-aspire-version-parity.ts:81-82` | Add the two rows, or soften the header to "every product/CI pin site (full set enforced by the parity gate)" — the skill's own `git grep` completeness step (SKILL.md:57,115-117) currently backstops the omission |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Carrier-chain diagrams must be derived from each generator's read-set, not from task-name adjacency in `deno.json` | `generate-export-surface-corpus.ts` vs `generate-cli-assets-barrel.ts` look like one pipeline by name but read disjoint trees (`packages`/`plugins` vs `skills/`) | docs skills describing generated-carrier chains | high |

## Hosted evidence (given, not rerun)

`quality` SUCCESS and `check-test` SUCCESS at exact head c231fbe5e; runtime tiers correctly skipped
under the docs-only classification. No PLAN-EVAL record exists — informational only for a docs PR.

## Verdict

| Field     | Value                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| Verdict   | FAIL_FIX                                                                                      |
| Rationale | The skill's value is citation accuracy, and its carrier-chain section — the part the independent audit specifically targeted — states one false dependency (`gen:mcp-export-corpus` consuming `skills/` prose). Everything else resolves at this head: all pin-map rows carry real literals, `.mise.toml` is correctly untracked, all fixture names, task names, gate names, and constants exist, README rows are consistent, and fmt + Claude-surface gates pass. The defect is a one-line reword inside the two-file scope; re-evaluate after the fix. The three LOW items are non-blocking polish that can ride the same edit. |

VERDICT: FAIL_FIX
