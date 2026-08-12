# Drift Log — copilot-evaluate-proposal-and-documentation--glidemq-rfc

Append-only.

- **2026-07-09 · blocked-lane · significant** — OpenHands PLAN-EVAL/IMPL-EVAL launch surfaces are
  unavailable in the Copilot cloud-agent sandbox. Recorded per `lane-policy.md` blocked-lane
  handling; fallback is drafts-only output + explicit pending-PLAN-EVAL status on the RFC.
  Mirrored in `supervisor.md`.
- **2026-07-09 · source-unreachable · minor** — `https://glidemq.dev/*` is DNS-blocked in the
  sandbox. Substituted the site's source-of-truth markdown in `avifenesh/glide-mq/docs/`
  (site is generated from it); mapping recorded in `research.md`.
- **2026-07-09 · source-unreachable · minor** — legacy benchmark repo `rickylabs/netscript-start`
  returns 404 via the GitHub API (private or removed). The benchmark issue draft scopes the
  successor from first principles instead of porting the legacy suite.
- **2026-07-09 · lane-binding · minor** — Tier-B research lanes ran on Copilot internal
  explore/research agents (not Opus 4.8) — the only research surface available here. Load-bearing
  claims (Garnet FUNCTION/Streams gaps, GlideMQ FCALL dependency, Deno NAPI uncertainty, queue/kv
  adapter inventories) were re-verified first-hand by the supervisor before entering findings.
- **2026-07-09 · tooling · minor** — `rtk` prefix convention not applied: the runner sandbox has
  no `rtk` binary on PATH; raw git/grep used via the platform's built-in tools instead.
