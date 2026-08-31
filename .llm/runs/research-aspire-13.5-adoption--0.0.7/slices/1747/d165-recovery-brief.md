use harness

## SKILL

- netscript-harness — commit-by-slice + push, run-dir artifacts, no self-certification.
- netscript-doctrine — `packages/cli` is framework code: contract first, no `any`, no unsafe casts.
- netscript-pr — body truth, closing keyword, labels; do not self-advance lifecycle.
- netscript-tools — scoped check/lint/fmt, repo-wide `deno task check`, lock hygiene.

## D-165 — URGENT bounded recovery for #1747. It is NOT merge-safe at `68c80e743`.

An independent audit plus my own empirical verification found this PR — whose entire purpose is
**resource-name safety** — currently emits **non-parsing JavaScript**. Do not defend the current head;
repair it.

### Proven defects (I rendered these at `68c80e743`; reproduce before fixing)

Rendering `generateRegisterBackground` with processors named `class` and `await`, and a `Workdir`
containing a quote, produces:

```
const class = builder.addExecutable("class", 'deno', class_workdir, [...]);      // INVALID JS
const await = builder.addExecutable("await", 'deno', await_workdir, [...]);      // INVALID JS
const await_workdir = resolveWorkspacePath(appHostDir, 'a'b');                   // BROKEN LITERAL
```

Root causes:

1. **`safeIdentifier()` only replaces hyphens** (`helpers/_utils.ts:26`) — no reserved-word guard. The
   convergence adopted main's *name-as-binding* scheme, so any reserved word becomes `const <kw>`.
   The earlier `bg_N` ordinal scheme was immune by construction; that immunity was lost.
2. **`JSON.stringify` is applied to the string argument but not to other emitted literals.**
   `Workdir` is interpolated raw as `'${workdir}'` (line ~76); `Entrypoint` and `ConcurrencyEnvVar`
   likewise. Any quote/backslash/backtick breaks or injects.

### Required repair

1. **Restore background-only ordinal binding semantics — no user text in the emitted identifier.**
   The `const <binding>` identifier must be generated (ordinal, e.g. `bg_0`), never derived from the
   resource name. This is what makes reserved words and collisions structurally impossible.
   **Keep** `JSON.stringify(name)` for the resource-name *string* argument and for
   `config.BackgroundProcessors[...]` lookups.
2. **Full JSON literal safety** for **`Workdir`, `Entrypoint`, `ConcurrencyEnvVar`** (and any other
   user-supplied string emitted into generated source) — emit via `JSON.stringify`, never raw
   `'${...}'` interpolation.
3. **PRESERVE the current users+sagas fixture union** in
   `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` — the
   `missingBackgroundReferences` union and its quote-agnostic, dynamically-captured anchors stay.
   Because the binding returns to an ordinal, the discovery regex must still capture it generically
   (`([A-Za-z_$][\w$]*)`) so it works for **both** ordinal and name-style bindings. Do not hardcode.
4. **Restore the direct-generator reserved/collision tests** that were lost. They must render through
   the real generator and assert emitted source for: reserved words (`class`, `await`, `function`,
   `const`), collision cases (two names normalizing to the same identifier), and quote/backslash/
   backtick in `Workdir`/`Entrypoint`/`ConcurrencyEnvVar`. **Type-check or parse the emitted output**,
   not just string-match it — string assertions would have missed `const class`.
5. **Remove UNRELATED DELETIONS from the diff.** `git diff --name-status origin/main..HEAD` currently
   shows **`D` for ~74 files under `.llm/runs/` belonging to 8 OTHER slices**
   (`docs-mcp-exports-table--1799`, `feat-openai-responses-mapper--1591`,
   `feat-plugin-service-context-host-factory--1452`, `fix-saga-publisher-receipt-discipline--0.0.7`,
   and others). Merging would destroy other slices' harness evidence. **Restore every one of them to
   match `origin/main`.** Keep this slice's own 11 files under
   `.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/` — those are legitimate.
6. **Converge onto current main `052f86595b06b33cf0e205405873cd979cf535d1`**; assert
   `merge-base HEAD origin/main == origin/main` (this slice is based on `main`, not stacked).
7. **Rewrite the PR body to the truth.** Remove any claim of a passing Phase-B/e2e state that does not
   exist, and remove stale DoD checkmarks that this recovery invalidates. Do not assert an IMPL-EVAL
   PASS — the prior one is void at the new head.

### Gates

RED first (record the failing render/parse output), then fix. Then: focused tests; scoped
check/lint/fmt; **repo-wide `deno task check`** expecting `failedBatches: 0`; `deno task quality:scan`;
`deno task arch:check`; `check:aspire-version-parity` `fail=0`.

**No runtime** — host runtime is parked (upstream Aspire remote-Docker constraint). Do **not** start
Aspire/Docker. Hosted CI will supply the runtime evidence separately.

**Do not** add `impl-eval:skip`, do not self-dispatch an evaluator, and do not change lifecycle
labels — a fresh supervisor-dispatched GLM IMPL-EVAL follows this work.

Push with `--force-with-lease` against a freshly read `git ls-remote` SHA. Report old/new head, the
reproduced RED output, each repair, the restored-deletions count, and every gate's exit code.
