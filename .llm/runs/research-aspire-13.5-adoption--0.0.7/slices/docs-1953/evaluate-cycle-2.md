# Evaluation: IMPL-EVAL cycle 2 — PR #1953 (aspire-upgrade skill), repair head 07c4a0b93

Bounded re-check. Cycle 1 (head c231fbe5e) returned FAIL_FIX with four findings; this cycle judges
ONLY whether each finding is resolved by repair commit `07c4a0b93`. No re-audit of the rest of the
skill was performed, and no gate beyond the two mandated ones was run.

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7`                                       |
| Target         | PR #1953 repair head `07c4a0b93` (`.agents/skills/aspire-upgrade/SKILL.md`)  |
| Archetype      | N/A (docs-only skill change)                                                 |
| Scope overlays | docs                                                                         |
| Evaluator      | separate-session IMPL-EVAL cycle 2, OpenRouter z-ai/glm-5.3-flash xhigh, 2026-09-03 |

## Repair Scope Verification

| Check                                            | Result | Evidence                                                                                                                                   |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Repair commit touches only SKILL.md              | PASS   | `git show --stat HEAD` = 1 file, `.agents/skills/aspire-upgrade/SKILL.md` (+23/−21)                                                        |
| PR diff still SKILL.md + `.agents/skills/README.md` | PASS | `git diff --stat 88fc6d69d..HEAD` = exactly those 2 files (+182)                                                                            |
| Worktree clean at detached head                  | PASS   | `git status --porcelain` empty; HEAD = `07c4a0b93c873d316ef91c20c92f97f2fed4d3c6`                                                          |

## Cycle-1 Finding Resolution

| ID | Severity | Finding (cycle 1)                                                            | Result    | Evidence at `07c4a0b93`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -- | -------- | ---------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 | MEDIUM   | Carrier chain wrong: `gen:mcp-export-corpus` listed inside the chain          | RESOLVED  | SKILL.md:85-92 now reads `skills/` prose -> `gen:assets-barrel` (`embedded.generated.ts`, `skills.generated.ts`) -> `gen:publish-assets` -> `check:publish-assets`, and states `gen:mcp-export-corpus` "reads only `packages/`/`plugins/` doc surfaces and is not part of this chain". Ground truth matches: `.llm/tools/generate-cli-assets-barrel.ts:40` reads `../../skills/manifest.json` and `:226` reads `../../skills/${path}`; `.llm/tools/docs/generate-export-surface-corpus.ts:7` has `GENERATOR_READ_SET = ['packages', 'plugins']` (no `skills/`); `deno.json:118,124,125` define `gen:assets-barrel`, `gen:publish-assets`, and `check:publish-assets` (= `gen:publish-assets --check`) in the asserted order. |
| F2 | LOW      | Fixture row said "14 tools + `refresh_tools`" (additive ⇒ implies 15)         | RESOLVED  | SKILL.md:77 now says "14 tools incl. `refresh_tools` at 13.5.3". Fixture `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` has exactly one `tools` array, length 14, with `refresh_tools` as a member (11th of 14) — inclusive reading is exact.                                                                                                                                                                                                                                                                                                                               |
| F3 | LOW      | Three `.llm/runs/…-0.0.7/{research,plan,drift}.md` rows presented as in-repo files | RESOLVED | SKILL.md:165-167 labels each row "(run evidence on branch `research/aspire-13.5-0.0.7`; not on `main`)". Verified: `git ls-files` for the three files is empty (the run dir tracks only `aspire-surface-manifest.tsv`, `slices/s5/repair/*`, `tools/aspire-surface-manifest.ts`); `git ls-tree origin/main` shows none of the three; all three exist on branch `research/aspire-13.5-0.0.7` (local + `origin/…`, via `git ls-tree -r`). Label is accurate.                                                                                                                                        |
| F4 | LOW      | Pin map missing `.github/toolchain.env` + cache-policy test rows; heading claimed "every place" | RESOLVED | New "CI toolchain policy" row at SKILL.md:49. Both files exist and carry `13.5.3`: `.github/toolchain.env` (`NETSCRIPT_ASPIRE_CLI_VERSION=13.5.3`, `NETSCRIPT_ASPIRE_SDK_VERSION=13.5.3`), `.github/scripts/aspire-nuget-cache-policy.test.ts` (`nuget-aspire-${{ runner.os }}-13.5.3-v1`, `--version 13.5.3`). Heading is now "The pin map — where the version literal lives" (SKILL.md:41; "every place" removed); sweep count updated ~6 -> ~8 files (SKILL.md:56), consistent with the two added rows. Bonus accuracy: `check-aspire-version-parity.ts:81-82` lists both files in its expectations map, so the row's "enforced by the parity gate" claim is also true. |

## Static Gates

| Gate    | Command or check                                                                | Result   | Evidence                                   | Notes                       |
| ------- | -------------------------------------------------------------------------------- | -------- | ------------------------------------------ | --------------------------- |
| Format  | `deno fmt --check .agents/skills/aspire-upgrade/SKILL.md .agents/skills/README.md` | PASS     | "Checked 2 files", exit 0                  | Mandated cycle-2 command    |
| Surface | `deno run --allow-read --allow-env --allow-run .llm/tools/agentic/claude/validate-claude-surface.ts` | PASS | JSON `ok: true`, all 6 sub-checks, exit 0  | Mandated cycle-2 command    |
| Others  | typecheck / lint / doc lint / publish dry-run / link check                        | NOT_RUN  | —                                          | Out of bounded re-check scope; cycle-1 scope unchanged by a Markdown-only repair |

## Fitness / Runtime / Consumer Gates

NOT_RUN — out of bounded re-check scope. The repair touches only `.agents/skills/**` prose, which
regenerates nothing in any carrier (`skills/**`, not `.agents/skills/**`, is the barrel input).

## Anti-Pattern Check

N/A — Markdown-only skill-doc repair; no code, no generated files, no package surface touched.

## Findings (cycle 2)

None. All four cycle-1 findings are resolved; no new defect was introduced by the repair commit
(the added parity-gate claim in the F4 row was spot-checked and is true).

## Verdict

| Field     | Value                                                                                   |
| --------- | --------------------------------------------------------------------------------------- |
| Verdict   | PASS                                                                                    |
| Rationale | Repair commit is correctly scoped to SKILL.md only; F1–F4 each match ground truth in the generators, fixture, git tracking state, and `.github/` files; both mandated gates exit 0. |

VERDICT: PASS
