# Context Pack

- Branch: `ci/e2e-cli-gate`.
- PR: draft #81 into `main`.
- Scope: CI/tooling infra only; no package archetype and no package/plugin source changes.
- Workflow touched: `.github/workflows/e2e-cli.yml`.
- Local validation is green:
  - `scaffold.runtime --cleanup --format pretty`: `passed=41 failed=0`.
  - `scaffold.service --format pretty`: `passed=4 failed=0`.
  - `scaffold.contracts --format pretty`: `passed=4 failed=0`.
  - `scaffold.plugins --format pretty`: `passed=9 failed=0`.
- Aspire installer finding: `aspire.dev/install.sh --version 13.4.4` 404s; `dotnet tool install Aspire.Cli --tool-path <scratch>/bin --version 13.4.4` succeeds and reports `13.4.4+...`.
- Acceptance status: local acceptance met; CI runner confirmation remains supervisor-owned because `gh` is unavailable here.
