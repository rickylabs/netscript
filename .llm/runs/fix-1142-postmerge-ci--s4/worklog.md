# S4 worklog — post-merge / deleted-ref CI hardening

## Design

- Public surface: GitHub Actions behavior only; no package or plugin API changes.
- Domain vocabulary: `diff_unavailable` records an unresolvable PR diff; `target-ref.exists`
  records whether the OpenHands checkout ref still exists remotely.
- Ports: `git diff` supplies the PR change set; `git ls-remote` resolves the OpenHands target ref.
- Constants: `__EOF__` remains the changed-files output delimiter; exit code `2` from
  `git ls-remote --exit-code` means no matching ref.
- Commit slice: make diff output transactional, skip downstream E2E jobs when the diff cannot be
  resolved, and guard all OpenHands work behind remote ref resolution. Proved by the negative-case
  transcripts and workflow YAML validation below.
- Deferred scope: production E2E workflows, `ci.yml`, and release tooling are explicitly excluded.
- Contributor path: change classification stays in `e2e-cli.yml`; OpenHands trigger/ref handling
  stays at the beginning of the `agent` job in `openhands-agent.yml`.

## Implementation

- `e2e-cli.yml` now skips classification for an already-merged PR. For other PR events, it computes
  the rename-aware diff in a temporary file before appending a complete output block. An
  unresolvable base/head prints the actual Git diagnostic, sets `diff_unavailable=true`, and causes
  all three downstream E2E jobs to skip cleanly.
- `openhands-agent.yml` now resolves the requested branch/tag before acknowledging the trigger or
  checking out code. A missing ref emits a notice, records `exists=false`, exits successfully, and
  guards every later agent and housekeeping step. Other `ls-remote` failures remain genuine errors.

## Negative-case evidence

### #1142 — old pattern corrupts the output file

Local `bash -e` reproduction using the old opener → diff → closer ordering:

```text
OLD status: 128
OLD fake GITHUB_OUTPUT:
changed<<__EOF__
OLD stderr:
fatal: Invalid symmetric difference expression deadbeefdeadbeefdeadbeefdeadbeefdeadbeef...badc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffe
```

The fake output contains the opener and no closer.

### #1142 — new pattern preserves output framing and the Git error

Local `bash -e` reproduction using the new temp-file-first ordering:

```text
NEW status: 0
NEW fake GITHUB_OUTPUT:
diff_unavailable=true
NEW stderr:
Unable to classify changes because the PR base or head SHA is no longer resolvable.
fatal: Invalid symmetric difference expression deadbeefdeadbeefdeadbeefdeadbeefdeadbeef...badc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffe
```

No heredoc is opened on the failure path, and the true Git error remains visible.

### #1174 — deleted-ref guard

Local guard simulation with `git rev-parse --verify` and a nonexistent ref:

```text
REF GUARD:
exists=false
::notice::OpenHands skipped because target ref rickylabs/netscript@refs/heads/__s4-deleted-ref-does-not-exist__ no longer exists.
```

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `command -v actionlint` | unavailable | No workflow linter is installed; the unapproved npm fallback was not used. |
| Deno YAML parse | PASS | `YAML OK` for `.github/workflows/e2e-cli.yml` and `.github/workflows/openhands-agent.yml`. |
| Negative case: old diff output | PASS | Exit 128 leaves the intentionally reproduced unterminated `changed<<__EOF__` block. |
| Negative case: new diff output | PASS | Exit 0 writes only `diff_unavailable=true` and prints the Git failure. |
| Negative case: deleted ref | PASS | `git rev-parse --verify` takes the guarded notice path. |
| `rtk git diff` self-review | PASS | Reviewed only the two owned workflows and this run worklog; no out-of-scope source change found. |

## Reconcile

- Issues #1142 and #1174 remain open for the supervisor-owned PR to close. No labels, milestones,
  comments, pushes, or PR state were changed by this implementation lane.
- No plan/design drift observed from the locked S4 contract.
