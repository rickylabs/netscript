# FILING-LOG — deploy-plugin board (2026-07-19)

> **Authority: GitHub wins on conflict from this point.** Filed on PLAN-EVAL PASS
> (OpenHands · qwen/qwen3.7-max, verdict comment on PR #891) under the owner directive
> "dispatch & on pass create the epic, sub issues and prioritize them on milestones (allowed to
> create further betas)". Source: `filing-manifest.md` (commit `c7c68270`), executed one-shot.

## Created

- Label `epic:deploy-plugin` (5319e7). **Parity follow-up:** add to `.github/labels.yml` in a
  framework slice (this run cannot edit repo config).
- Milestones: `0.0.1-beta.15` = #17 (W4 container path) · `0.0.1-beta.16` = #18 (W5 probe-gated
  clouds). Existing used: `0.0.1-beta.13` = #15 (W1–W3 + host + docs) · `Backlog / Triage` = #3.
- **EPIC #892** — Epic: Deploy plugin family (beta.13).

## DPB → live issue map

| DPB | # | Milestone | | DPB | # | Milestone |
| --- | --- | --- | --- | --- | --- | --- |
| DPB-1 | #893 | beta.13 | | DPB-16 | #908 | beta.13 |
| DPB-2 | #894 | beta.13 | | DPB-17 | #909 | beta.13 |
| DPB-3 | #895 | beta.13 | | DPB-18 | #910 | beta.13 |
| DPB-4 | #896 | beta.13 | | DPB-19 | #911 | beta.13 |
| DPB-5 | #897 | beta.13 | | DPB-20 | #912 | beta.15 |
| DPB-6 | #898 | beta.13 | | DPB-21 | #913 | beta.15 |
| DPB-7 | #899 | beta.13 | | DPB-22 | #914 | beta.15 |
| DPB-8 | #900 | beta.13 | | DPB-23 | #915 | beta.16 |
| DPB-9 | #901 | beta.13 | | DPB-24 | #916 | beta.16 |
| DPB-10 | #902 | beta.13 | | DPB-25 | #917 | beta.16 |
| DPB-11 | #903 | beta.13 | | DPB-26 | #918 | beta.16 |
| DPB-12 | #904 | beta.13 | | DPB-27 | #919 | beta.16 |
| DPB-13 | #905 | beta.13 | | DPB-28 | #920 | beta.13 |
| DPB-14 | #906 | beta.13 | | DPB-29 | #921 | Backlog/Triage |
| DPB-15 | #907 | beta.13 | | | | |

All children: `[deploy-plugin DPB-n]` titles; labels `epic:deploy-plugin area:deploy status:plan`
+ one `type:` + one `priority:` + secondary areas per manifest; `Part of #892` bodies with
`- [ ] gate:` acceptance + `Dependencies:`/`Delivery shape:` metadata.

## Supersession executed (RFC #891 §6)

| Issue | Action |
| --- | --- |
| #824 | CLOSED with successor pointer (epic #892 / RFC #891) |
| #823 | KEPT OPEN — pointer comment: deploy half now owned by #892; single-runtime framing to be re-stated (owner) |
| #327 | KEPT OPEN — pointer comment: #892 is the deployment architecture successor |
| #454 | KEPT OPEN — pointer comment: deploy aspect absorbed by the cell/capability model; close-or-fold = owner call |
| #451 / #453 / #455 | UNTOUCHED (KEEP per RFC) |

## Not done (deliberate)

- GitHub-native sub-issue linkage (opportunistic nice-to-have; Markdown checklist + `Part of`
  used, per netscript-pr).
- `.github/labels.yml` parity (framework slice; noted above).
