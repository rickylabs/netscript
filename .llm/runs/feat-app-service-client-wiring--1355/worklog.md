# Worklog: app-side service client/query wiring

## Run Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `feat-app-service-client-wiring--1355`                |
| Branch         | `feat/app-service-client-wiring`                      |
| Archetype      | `2 — Integration` (SDK seam; CLI 6, Fresh 4 retained) |
| Scope overlays | `frontend`                                            |

## Design

### Public Surface

- Proposed additive `bridgeInvalidation(queryKey)` overload while retaining the string overload.
- Proposed all-service client generation request/result with planned, written, and skipped files.
- Existing `IslandQueryOptions.initialDataUpdatedAt`; no new Fresh query type.

### Domain Vocabulary

- **service identity** — manifest key transformed by the canonical router-name casing.
- **resource prefix** — `[serviceIdentity]` or `[serviceIdentity, procedure]` shared across cache
  tiers for invalidation.
- **service-client generation plan** — sorted, fully validated files before mutation.
- **cache age** — server `cachedAt` preserved as TanStack `dataUpdatedAt`.

### Ports

- `FileSystemPort` — content comparison and atomic plan-then-write generation.
- `ServiceWorkspaceResolver` — sorted manifest-owned service discovery.
- `ScaffolderPort` / template renderer — current generated-file edge, to be reconciled behind one
  generator use case.

### Constants

- No new global constant group planned; service identity is derived data.

### Commit Slices

| #  | Slice                                               | Gate                                           | Files                                                    |
| -- | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| S0 | Phase-1 research/plan and draft PR                  | Identity + `git diff --check`; no product gate | Run artifacts only                                       |
| S1 | SDK key-derived invalidation contract               | Focused SDK check/test/doc-lint                | SDK query-client/types/tests                             |
| S2 | CLI generator and per-service key contract          | Focused CLI check/tests/assets                 | CLI service feature, templates, E2E fixtures             |
| S3 | Canonical cache age/browser coverage/migration note | Focused CLI/Fresh check/test/doc-lint          | CLI islands/tests; Fresh browser test/task/README        |
| S4 | Cheap contracted and JSR convergence                | check/test/publish-dry-run/arch-check          | Receipts/reports only unless a gate finds a scoped fix   |
| S5 | Released runtime/browser proof                      | scaffold.runtime/fresh-browser                 | Receipts/reports only unless a gate finds a scoped fix   |
| S6 | IMPL-EVAL and bounded repairs                       | Fresh Tier-A verdict                           | Evaluation artifact plus any separately committed repair |

### Deferred Scope

- Installed SDK contributions — owned by #1348.
- Remaining island-query type/JSDoc work — owned by #1245.
- Broader app/route generator modernization — owned by #1333/#1354/#1357.

### Contributor Path

Add a service to the root `NetScript.Services` manifest (normally through `netscript service add`),
then run the broadened `netscript service generate`; the shared generator validates the matching
contract and deterministically creates or reconciles `apps/<app>/lib/<service>.ts`.

## Progress Log

| Time                      | Slice | Step     | Notes                                                                                                                                                    |
| ------------------------- | ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15T12:39:58+02:00 | S0    | Identity | Clean tree; branch/base/origin exact; no upstream/remote branch by design.                                                                               |
| 2026-08-15T12:39:58+02:00 | S0    | Research | Re-verified SDK, CLI generator/templates, Fresh hydration hook/tests, commands, package manifests, and issue acceptance at the pinned base.              |
| 2026-08-15T12:39:58+02:00 | S0    | Plan     | Proposed PLAN-EVAL required and both expensive gates required only after cheap convergence and coordinator release.                                      |
| 2026-08-15T12:49:56+02:00 | S0    | Draft PR | Pushed only the Phase-1 run artifacts, opened draft PR #1664 with both closing keywords, attached milestone/taxonomy, and posted RESEARCH/PLAN comments. |

## Decisions

| Decision                                    | Reason                                                             | Source                                   |
| ------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Preserve landed derived names               | Current base already contains the #1355 naming correction.         | Code/history/research finding 3          |
| Router identity owns every resource prefix  | It is the manifest-derived identity shared by routing and clients. | Plan D1                                  |
| Recommend typed/key-derived bridge overload | It makes procedure drift a type failure while preserving callers.  | Research public delta; pending PLAN-EVAL |
| Stop before implementation                  | User explicitly requested Phase 1 only.                            | Leaf brief                               |

## Drift

| Drift                                                          | Severity    | Logged in drift.md |
| -------------------------------------------------------------- | ----------- | ------------------ |
| Issue paths/line numbers moved and symbol naming already fixed | Significant | Yes                |
| `key-bridge.ts` server-key comment is stale                    | Minor       | Yes                |
| Frontend overlay references missing file                       | Minor       | Yes                |
| Durable gate catalog lacks `scaffold.runtime`                  | Significant | Yes                |

## Gate Results

### Static Gates

| Gate           | Command or check                             | Result  | Notes                                     |
| -------------- | -------------------------------------------- | ------- | ----------------------------------------- |
| Identity       | Direct git/POSIX read-only checks            | PASS    | Required base and clean start confirmed.  |
| Product checks | Not run                                      | NOT_RUN | Phase 1 stop; no product code exists.     |
| JSR audits     | Baseline manifest/export/pin inspection only | NOT_RUN | Full audits planned after implementation. |

### Fitness Gates

| Gate      | Result         | Evidence                     | Notes                                 |
| --------- | -------------- | ---------------------------- | ------------------------------------- |
| Plan gate | PENDING_SCRIPT | `research.md`, `plan.md`     | PLAN-EVAL proposed required.          |
| F-5/F-6   | PENDING_SCRIPT | JSR section in research/plan | Three publishable members applicable. |

### Runtime Gates

| Gate               | Result  | Evidence                | Notes                       |
| ------------------ | ------- | ----------------------- | --------------------------- |
| `scaffold.runtime` | NOT_RUN | Explicit lease boundary | Prohibited without release. |
| `fresh-browser`    | NOT_RUN | Explicit lease boundary | Prohibited without release. |

### Consumer Gates

| Consumer                  | Result  | Evidence | Notes                              |
| ------------------------- | ------- | -------- | ---------------------------------- |
| Two-service generated app | NOT_RUN | S5 plan  | Requires implementation and lease. |
| Hydrated Fresh browser    | NOT_RUN | S5 plan  | Requires implementation and lease. |

## Handoff Notes

- Evaluator should inspect the proposed SDK overload versus a direct generated filter first.
- Then inspect generator atomicity/content comparison and whether the planned browser/runtime tests
  actually prove the user-visible invalidation and hydration-age behavior.
- No implementation, expensive gate, issue mutation, ready transition, or central-state mutation has
  occurred in S0.
