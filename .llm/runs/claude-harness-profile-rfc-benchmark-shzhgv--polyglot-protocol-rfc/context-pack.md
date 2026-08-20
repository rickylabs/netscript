# Context pack — polyglot-protocol-rfc (run 5)

Resume point: **S9 complete — RFC authored, gates green; awaiting IMPL-EVAL verdict on PR #1687, then close routine.**
tension register, pre-register verdict criteria + out-of-scope register) → PLAN-EVAL dispatch
(`status:plan-eval` on PR #1687, separate session, REQUIRED) → spikes → RFC authoring.

- Branch `claude/harness-profile-rfc-benchmark-shzhgv` restarted on post-#1686 main; draft PR
  **#1687** (labels type:docs area:plugins area:docs rfc ci:skip-e2e ci:skip-scaffold
  status:research, milestone Backlog/Triage).
- Run dir: `.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc/`.
  Corpus: `research-sources/` (32+ files, committed). Synthesis: `research.md`.
- Owner rulings (supervisor.md): Fable 5 end-to-end; Opus 5 medium = aggregation only;
  PLAN-EVAL required; IMPL-EVAL via draft→ready automation; owner adds Codex GPT 5.6 Sol Max
  adversarial pass; corpus lives in run dir; RFCs 1–4 get citizenship addenda post-RFC-5
  (task #27); defects filed as bugs, not RFC hostages.
- Core architecture direction (research-backed, to be locked in plan): protocol-first, tiered
  conformance T0/T1/T2; two surfaces (attempt-bound protocol verbs on task channel +
  authenticated loopback oRPC for ecosystem access); reserved NETSCRIPT_* env + allowlisted
  base env + per-attempt opaque token (capability record in Biscuit-shaped claims vocabulary);
  structured errors w/ ErrorBehavior + terminal-frame discipline; capability negotiation over
  version handshake (version field + yanked-registry); zod→JSON-Schema→per-language codegen;
  conformance harness `<tier>.<verb>.<behavior>` with mode inversion + generated capability
  matrix; port/adapter packages per auth blueprint.
- Spike list (plan phase): T-1 frame transport, T-2 token delivery, T-3 loopback TCP-vs-UDS +
  sandbox survival, T-6 stdin buffering per language, T-7 protocol overhead vs run-1..4
  baselines through the real dispatch path.
- Defect register D-1..D-14 in `research-sources/netscript-engine-audit.md` §6 — issues to be
  filed (not yet filed as of this slice).
- Prior series: #1678 scriptc, #1683 rust-workers, #1685 dotnet, #1686 golang (all merged);
  run-1 bench harness lineage reusable for T-7.
