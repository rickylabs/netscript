# Worklog — legacy-port-pin-sweep

## Design

- Public surface: `netscript plugin auth session list --stream-url <url>` changes from a silent
  legacy default to an explicit required input with Aspire discovery guidance. No exported symbol or
  entrypoint changes.
- Domain vocabulary: no new type is needed. The existing `streamUrl` option and
  `AuthSessionHttpPort` remain the contract.
- Ports: continue consuming `AuthSessionHttpPort`. The established endpoint discovery port is
  `ServiceEndpointDirectoryPort` in `@netscript/mcp`, but it cannot be wired without crossing the
  approved package/composition boundary; no parallel port will be invented.
- Constants: no new finite-domain constant. `4437` is deleted from live defaults/manifest fixtures;
  the generated skill's historical incident value remains prose evidence.
- Commit slices: (1) artifact/bootstrap + draft PR, (2) explicit URL contract + manifest/fixture pin
  removal, (3) publishability/gate evidence and handoff.
- Deferred scope: endpoint-directory injection, undeclared 4437 sites, all central coordination,
  publication, and expensive runtime execution without a lease.
- Contributor path: callers run `aspire describe streams --format Json`, select the advertised HTTP
  URL, append `/auth/sessions`, and pass it to `--stream-url`; a future convenience path must inject
  the existing MCP directory through CLI composition rather than parse Aspire output here.

## PLAN-EVAL

`PLAN-EVAL: N/A` — existing-seam research plus the immutable file boundary leaves only the issue's
explicit-URL/fail-loud fallback, so the implementation is locked and mechanical.

## Gate evidence

No gate has run. `scaffold.runtime`, Aspire, and Docker are forbidden until the coordinator-owned
global expensive-gate lease is explicitly granted.

## Research evidence

- Live issue API snapshot captured at `2026-08-13T20:23:46.556Z` in `research.md`.
- Baseline: branch = `origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Reproduction and existing-seam findings are recorded in `research.md`.
