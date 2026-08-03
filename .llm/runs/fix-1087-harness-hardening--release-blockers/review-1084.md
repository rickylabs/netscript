# Opposite-family slice review — #1084 publication-body ownership

- Reviewer: Claude Code (Fable 5), separate session from the Codex implementation lane
- Scope: uncommitted diff after `2f3e49456` (`gh-pr.ts`, `deno.json`, `README.md`,
  `seed-run.md`) plus untracked `publication-body.ts` / `publication-body_test.ts`
- Date: 2026-08-03

## Verdict: PASS

## Independently run gates

- `deno test publication-body_test.ts` — **4 passed, 0 failed** (collision-free concurrency,
  cross-session rejection, body + metadata tamper rejection, session-directory reuse refusal).
- `deno task agentic:gh-pr create --dry-run --pretty` with a real `--body-file` — exit 0; output
  printed only repo/head/base/title, **byte count (10)** and the staged path; no body content
  leaked. Observed on disk: directory `0700`, `body.md` and `metadata.json` `0600`, metadata
  carries matching `ownerSession` UUID and SHA-256 fingerprint.
- Scoped `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts --root .llm/tools/agentic
  --ext ts` — **131 files, 0 findings each**. Matches author evidence.
- `git check-ignore` confirms `.llm/tmp/` (and thus staged bodies) is gitignored; `deno.lock`
  untouched (lock hygiene clean).

## Boundary assessment

1. **UUID-scoped self-written artifact — MET.** `gh-pr.ts:285-288` copies the supplied inline or
   file body into `stagePublicationBody(suppliedBody, crypto.randomUUID())`; the artifact lives
   under `.llm/tmp/agentic/gh-pr/<uuid>/body.md` (`publication-body.ts:64-94`) and is created with
   `createNew: true`, so the invocation can only publish content it wrote itself.
2. **Verified re-read before payload — MET.** The payload body comes exclusively from
   `readOwnedPublicationBody` (`gh-pr.ts:288`, `publication-body.ts:97-118`), which enforces
   session identity (artifact + metadata `ownerSession`) and a double SHA-256 match (in-memory
   artifact fingerprint AND on-disk metadata fingerprint) against a fresh disk read. Cross-session
   reuse, metadata owner swap, and body swap each throw before any `githubRequest` — all three are
   test-covered.
3. **Concurrency + reuse refusal — MET.** Per-invocation UUID directories cannot collide
   (concurrency test passes with `Promise.all`); `Deno.mkdir(directory, { mode: 0o700 })` without
   `recursive` makes reuse of a session directory fail with `AlreadyExists` (test-covered), and
   `createNew: true` backstops the files.
4. **Modes, permissions, dry-run, residue, secrecy — MET.** Observed `0700`/`0600` modes match the
   claim. `deno.json` widens `agentic:gh-pr` only by `--allow-write=.llm/tmp/agentic/gh-pr` —
   correctly scoped to the staging root; usage docstring in `gh-pr.ts:25` matches. Dry-run stays
   network- and token-free and redacts the body (`payload.body` printed as `<N chars>`,
   `gh-pr.ts:315`). Failure residue: a staging-verification throw leaves the 0600 artifact behind
   under gitignored `.llm/tmp/`; see Low finding L1.
5. **Guidance — MET.** `seed-run.md:136-139` now mandates `.llm/tmp/<run-id>/<session-id>/...`
   scratch, explicitly forbids workspace-shared filenames, and preserves durable reviewed run-dir
   bodies; `README.md:210-221` documents the staging/verification pipeline. Grep found no
   remaining active guidance naming a shared body filename (see Info I1).
6. **Existing guards intact — MET.** The base-`main` refusal (exit 6) still runs before staging;
   verdict/merge paths, eval gating, and merge-body SHA pinning are untouched by the diff. No new
   output path prints body content in create, dry-run, or error branches.

## Findings (severity-ordered)

- **L1 (low) — no cleanup of staged artifacts.** Neither success nor failure removes
  `.llm/tmp/agentic/gh-pr/<uuid>/`; directories accumulate one per create invocation. Content is
  0600, gitignored, and each dir is tiny, so this is hygiene, not a safety gap — and retaining the
  artifact is arguably useful audit evidence. Acceptable; consider a future `agentic:teardown`-style
  sweep if volume grows.
- **L2 (low) — pre-existing root mode not tightened.** `Deno.mkdir(root, { recursive: true,
  mode: 0o700 })` (`publication-body.ts:70`) does not chmod a root that already exists with looser
  permissions. First creator in this repo will be the tool itself, so exposure is theoretical.
- **I1 (info) — `.agents/skills/netscript-release/SKILL.md:32`** still says "Use `gh ...
  --body-file` for release PR creation" without the per-session path convention. It names no
  shared filename, so boundary 5 is not violated; aligning it with the new scratch convention would
  be a small follow-up.
- **I2 (info) — naming duality.** Guidance tells agents to write `.llm/tmp/<run-id>/<session-id>/
  pr-body.md` while the tool stages its own copy under `.llm/tmp/agentic/gh-pr/<uuid>/`. This is
  intentional (input scratch vs. publication artifact) and the README explains it, but future docs
  should keep the distinction explicit.

No blocking findings. The slice does exactly what the acceptance boundaries require, the author's
evidence reproduces independently, and no guard or secrecy regression was found.

## Remediation verification — L2 root-mode tightening (2026-08-03)

- **Fix inspected:** `stagePublicationBody` now runs `Deno.chmod(root, 0o700)` immediately after
  the recursive mkdir (`publication-body.ts:71`), so a pre-existing looser root is tightened on
  every staging call, not only on first creation. The chmod targets the fixed publication root
  before any per-session content is written — correct ordering.
- **Test inspected:** new case `publication staging tightens a pre-existing root to owner-only`
  (`publication-body_test.ts:76-88`) chmods a temp root to `0755`, stages, and asserts
  `mode & 0o777 === 0o700`; correctly `ignore`d on Windows where POSIX modes don't apply.
- **Independently reproduced:** module tests now **5 passed, 0 failed** (author's 8/8 spans the
  wider compatibility set). Live end-to-end check: loosened the real `.llm/tmp/agentic/gh-pr` to
  `0755`, ran `agentic:gh-pr create --dry-run` — exit 0 and the root came back `0700`. The chmod
  stays inside the existing `--allow-write=.llm/tmp/agentic/gh-pr` scope; no permission widening.
- **Gates:** scoped check/lint/fmt over `.llm/tools/agentic/github` — 7 files, 0 findings each.
- **Finding status:** L2 **resolved**. L1 accepted as intentional audit residue under gitignored
  `0700`/`0600` storage; I1/I2 remain informational, no action required.

## Verdict: PASS (reaffirmed after L2 remediation)
