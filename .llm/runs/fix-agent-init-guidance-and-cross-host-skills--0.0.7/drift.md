# Drift Log: agent-init guidance and cross-host skills

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — #1674 older scope refinement conflicts with current re-intake

- **What:** Live issue comment `5313223606` says to delete `apps/<app>/AGENTS.md` and rewrite one
  root file; the current grouped re-intake explicitly requires linking the app guide and forbids
  changing example routes.
- **Source:** #1674 comment and run `implement.md`.
- **Expected:** Carried issue discussion and current brief would agree.
- **Actual:** They prescribe opposite generated-file relationships.
- **Severity:** significant
- **Action:** accept the newer explicit re-intake as current authority; preserve/link the app guide.
- **Evidence:** `research.md` Re-baseline and #1674 acceptance mapping.

## 2026-08-30 — #1672 older skill expansion is outside the current ceiling

- **What:** Live issue comment `5311467701` proposes editing the repository's
  `netscript-deno-toolchain` skill, while the current re-intake explicitly forbids it.
- **Source:** #1672 comment and run `implement.md`.
- **Expected:** Carried issue discussion and current brief would agree.
- **Actual:** The re-intake narrows this leaf to generated consumer guidance.
- **Severity:** significant
- **Action:** accept the newer explicit ceiling; link to the generated `.agents/skills/deno` skill
  and leave the internal skill unchanged.
- **Evidence:** `research.md` Re-baseline and product path ceiling.

## 2026-08-30 — CLI formatting is excluded from the authoritative root formatter

- **What:** The planned structured format gate selects the authored CLI files, but the repository
  root `fmt.exclude` drops all of `packages/cli/`; an explicit temporary config processes them but
  reports legacy whole-file quote/wrapping differences unrelated to this slice.
- **Source:** `deno.json`, structured formatter coverage refusal, and `scoped-fmt.json`.
- **Expected:** The planned scoped wrapper would produce a non-empty clean verdict.
- **Actual:** A clean verdict would require an ad hoc whole-file rewrite across the approved paths,
  adding hundreds of review-noise lines and diverging from the repository's explicit exclusion.
- **Severity:** significant
- **Action:** Keep the focused local-style diff, retain the structured failure evidence, use
  `git diff --check` for changed-line whitespace, and surface formatter disposition to Tier-A.
- **Evidence:** `.llm/tmp/gate-receipts/agent-init-guidance/scoped-fmt.json`.

## 2026-08-30 — Local scaffold needs disposable offline-doc version evidence

- **What:** A fresh local-source scaffold has workspace package members but no root `imports`, while
  the existing offline-doc generator only accepts exact NetScript package evidence from root imports.
- **Source:** Fresh `netscript-dev init` output and `resolveInstalledNetScriptPackages`.
- **Expected:** `agent init --with-docs` would resolve local workspace package versions directly.
- **Actual:** It rejects with `No installed @netscript/* package evidence was found in deno.json`.
- **Severity:** minor
- **Action:** Add disposable `"@netscript/cli": "workspace:"` evidence inside the proof fixture,
  record it in the receipt, rerun the real command, and remove the fixture. No product rescope.
- **Evidence:** `.llm/tmp/gate-receipts/agent-init-guidance/scaffold-proof.json`.

## 2026-08-30 — Live PR base advanced after the fixed intake baseline

- **What:** GitHub `main` advanced beyond `5bb112dd35f94fc8435672e2cabff1f9a447aa0b` after intake.
- **Source:** Draft PR #1729 base metadata versus the grouped slice brief.
- **Expected:** The exact intake base and live PR base would remain identical during implementation.
- **Actual:** The implementation branch remains rooted at the explicitly requested SHA while the
  draft PR compares against newer live `main`.
- **Severity:** minor
- **Action:** Do not rebase without supervisor direction; report the exact head and fixed base.
- **Evidence:** PR #1729 metadata and raw git ancestry verification.

## 2026-08-30 — Tier-A authorizes exact current-main integration

- **What:** Tier-A resolved the earlier stale-base hold by requiring an ordinary merge of exact
  `origin/main` `8b1e42f725919457c64781d5973fd419017fab13`, explicitly preserving the attested commits.
- **Source:** Supervisor integration brief after accepting checkpoint `83d24ba57...`.
- **Expected:** The earlier run stopped without rebasing or integrating until supervisor direction.
- **Actual:** Direction is now explicit; merge commit `a04e505f4bd837c4237cd98e55d143f61f11816a`
  has accepted head and current main as its two parents.
- **Severity:** minor
- **Action:** Merge, do not rebase; regenerate all four shared derivative families in order; retain
  the five-path product ceiling. Regeneration was idempotent and no conflict required resolution.
- **Evidence:** Merge parents, four exit-0 shared checks, and byte-identical five-path comparison.
