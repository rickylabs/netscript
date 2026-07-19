# FILING-LOG — plan-frontend-contrib--seed (board filed 2026-07-19)

Owner authorized epic + sub-issue creation in-turn (remote-control, 2026-07-19), including
milestone selection ("look on what milestone it fits best", deploy-lane split as precedent) and
new-milestone authority (not needed — existing milestones fit).

**After this filing, GitHub is the single source of truth for the board.** Run docs carrying
FCB-n / FCL-EPIC tags are the planning record; on conflict, GitHub wins.

- Label created: `epic:frontend-contrib` (#1d76db) — mirrored into `.github/labels.yml` (this branch).
- Epic: **#922** — `Epic: Frontend contribution layer — plugins that ship UI` · milestone `0.0.1-beta.13`.
- Milestone rationale: core waves (0/1/1b/2 + first-party panels) → **beta.13** — the layer is the
  dashboard epic's (#400) prerequisite in the same cut, mirroring the deploy lane's W1–W3→beta.13
  split (epic #892); consumer frontends + adoption → **beta.15** (parallel to deploy W4);
  completion wave → **beta.17** (milestone #19, created 2026-07-19 per owner re-scheduling: no
  Backlog items — everything ships before stable).
- Supersession map (RFC §6): #427 KEEP re-baseline · #432 KEEP re-baseline · #400 consumer ·
  ai chat-route repositioned — **zero closes at filing time** (folds happen via downstream PRs).

## Draft-ID → live issue

| Draft | Issue | Milestone | Priority | Title |
| --- | --- | --- | --- | --- |
| FCB-1 | #923 | 0.0.1-beta.13 | p0 | P1 proof: mounted sub-app command ordering |
| FCB-2 | #924 | 0.0.1-beta.13 | p0 | P2 proof: literal lazy route loaders + normalizeFreshRouteModule |
| FCB-3 | #925 | 0.0.1-beta.13 | p0 | P3 proof: dependency-island build matrix + plugin-vite pin policy |
| FCB-4 | #926 | 0.0.1-beta.13 | p0 | P4 proof: SSR failure-containment fixtures |
| FCB-5 | #927 | 0.0.1-beta.13 | p0 | P5 proof: gateway threat model + streaming abort |
| FCB-6 | #928 | 0.0.1-beta.13 | p0 | @netscript/plugin-frontend-core contracts/v1 |
| FCB-7 | #929 | 0.0.1-beta.13 | p0 | @netscript/plugin pointer axis (.withFrontend) |
| FCB-8 | #930 | 0.0.1-beta.13 | p0 | Frontend registry emissions: transactional replace-set |
| FCB-9 | #931 | 0.0.1-beta.13 | p0 | @netscript/fresh/plugins host runtime |
| FCB-10 | #932 | 0.0.1-beta.13 | p1 | Scaffold template wiring + HostSurfaceDescriptor + vite feed |
| FCB-11 | #933 | 0.0.1-beta.13 | p1 | Workers dogfood: zone panel + console route + island |
| FCB-12 | #934 | 0.0.1-beta.13 | p1 | Generated deny-by-default procedure gateway |
| FCB-13 | #935 | 0.0.1-beta.13 | p2 | plugin new --with frontend |
| FCB-14 | #936 | 0.0.1-beta.13 | p1 | netscript plugin dev (frontend watch loop) |
| FCB-15 | #937 | 0.0.1-beta.13 | p2 | Doctor frontend check + five-state taxonomy |
| FCB-16 | #938 | 0.0.1-beta.13 | p2 | Quarantine render states + provenance chrome |
| FCB-17 | #939 | 0.0.1-beta.15 | p1 | AppTarget scaffolder seam + plugin resource add --app |
| FCB-18 | #940 | 0.0.1-beta.13 | p1 | defineFrontendTestSuite + budgets enforcement |
| FCB-19 | #941 | 0.0.1-beta.15 | p2 | generate frontend-wiring adoption verb |
| FCB-20 | #942 | 0.0.1-beta.15 | p1 | Auth v1 frontend (account + session widget + signin starter) |
| FCB-21 | #943 | 0.0.1-beta.15 | p1 | AI frontend (durable chat route + assist launcher) |
| FCB-22 | #944 | 0.0.1-beta.13 | p2 | Sagas/triggers/streams dashboard-zone panels |
| FCB-23 | #945 | 0.0.1-beta.17 | p2 | auth-org backend capability (org-console prerequisite) |
| FCB-24 | #946 | 0.0.1-beta.17 | p3 | Convention generator (generate frontend) |

Filing was one-shot from the committed manifest (`briefs`/tmp manifest mirrored here); every
child carries `Part of #922`, `epic:frontend-contrib`, one `status:plan`, `type:`/`area:`/
`priority:`, and its milestone. First pull: p0s #923–#931.

**Amendment 2026-07-19 (owner):** milestone `0.0.1-beta.17` (#19) created; #945/#946 moved Backlog → beta.17. Final split: 18 → beta.13 · 4 → beta.15 · 2 → beta.17.
