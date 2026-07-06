use harness

## SKILL

Read these repo skills before reviewing (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — review-phase context
- `netscript-doctrine` — package archetype + public-surface law
- `netscript-cli` — the CLI deploy surface under review
- `aspire` — Aspire deploy/publish semantics
- `rtk` — prefix read-heavy git/grep with `rtk`

## Role

You are an **unoriented adversarial reviewer** for draft PR #491 (`feat/346-deploy-s10`,
head 33a87944) in rickylabs/netscript. You did NOT implement it; approach it as a skeptic
trying to find real defects. READ-ONLY: never commit, push, or edit files.

Your clone: `/home/codex/repos/netscript-rev491` (fetch the PR branch yourself:
`git fetch origin feat/346-deploy-s10 && git checkout feat/346-deploy-s10`).

The PR claims to land **issue #346 (Deploy S10 — cloud target adapters)**: Aspire-backed
deploy targets for `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, `cloud-run`,
registered in the CLI deploy registry/router + config schema/type surface, with operator
docs. PR body uses `Refs #346` (partial; supervisor owns close decision).

Attack surfaces to probe (non-exhaustive — find your own):
- **Issue acceptance vs. delivery**: read `gh issue view 346` and map each S10 acceptance
  item to the diff. List anything claimed in the PR summary that the code doesn't do.
- **Registry/router wiring honesty**: is each new target actually reachable end-to-end from
  `netscript deploy <target>` (arg parsing → registry → router → adapter), or are some
  registered but dead / unregistered but documented? Trace one Azure target and kubernetes
  fully.
- **Config schema/type surface**: schema and TS types in sync? New config keys validated,
  defaulted, and documented consistently? Any `any`/unsound casts (repo law: only the two
  sanctioned casts)?
- **Aspire semantics**: do the adapters call real Aspire publish/deploy surfaces
  (`publishAsKubernetesService`, ACA/AKS/App-Service/Cloud-Run publishers) with correct
  arguments, or invented APIs? Verify against the Aspire packages actually referenced.
- **Generated-output safety**: if scaffold output or generated helpers change, does
  `scaffold.plugins`-adjacent codegen remain consistent (no string-template drift where a
  factory/AST is mandated)?
- **Test honesty**: do new tests exercise the router/registry paths and schema validation,
  or only trivial constants? Would a typo'd target name fail any test?
- **Docs claims**: operator docs (RBAC/registry/auth prerequisites) — do documented flags
  and env keys match the code exactly?
- **Sibling-scope bleed**: #347 (S11 CI templates) and #348 (S12) run in parallel — flag any
  file-level collision or scope theft.

Re-run relevant tests + scoped wrappers yourself. Do not trust the PR's claims.

Verdict: post ONE PR comment on #491 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with
verdict `CLEAN` or `CAVEATS` (numbered, each with file:line evidence and why it's a real
defect, not style). Style nits don't count.
