/**
 * Coverage floors and shrink-only ceilings for package and plugin README fences.
 *
 * READMEs are the JSR landing page for every published package, and their code fences were required
 * to exist (`check-readme-standard`) without ever being compiled: `docs:snippets` walks `docs/site`
 * only, and the JSDoc gate covers `@example` blocks in source, not `.md`. A README could therefore
 * name a dead specifier or a renamed symbol and stay green (#1924).
 *
 * Every value below is the exact measured census on `main` `4720596fc`, so the corpus can neither
 * shrink to manufacture a pass nor grow its failing set silently. Changing one is a one-line,
 * reviewable diff.
 *
 * Lowered by #1934, which repaired the debt the gate made visible rather than carrying it:
 * `typeErrors` 32→7, `failingReadmes` 7→5, `syntaxInvalid` 1→0. Closing the unterminated
 * four-backtick fence in `packages/mcp/README.md` also un-masked two blocks the aborted parse had
 * been hiding, so `tsLike` rose 72→73 and `checked` 71→73.
 *
 * The 7 that remain are 6 `TS2307` on modules that correctly have no repository path — imports of
 * consumer-owned or installer-emitted files (`blocks/contracts/orders.ts`, `blocks/router.ts`,
 * `.generated/client.server.ts`, `auth/sdk-client.ts`) and the two illustrative aliases
 * `@app/router.ts` and `@example/contracts` — plus one `TS18046` downstream of the `@app/*` one.
 *
 * Five of the six are not honestly repairable in place: the README would have to name something
 * other than what a reader actually writes. The `@app/router.ts` pair is a **disclosed tradeoff**,
 * not an impossibility — a faithful `@app/router.ts` support stub in `materializeSharedSupports`,
 * following the fabrication pattern already used there for `@app/lib/*`, would clear both errors
 * (7→5, failing READMEs 5→4) without changing a character of the README. It is left out here
 * because a fabricated router stub can drift from the real scaffold generator, and a shared fixture
 * that every package's fences compile against deserves its own evaluated slice rather than a
 * late addition to this one.
 */
export const README_FENCE_RATCHET = {
  /** Discovered `packages/*` and `plugins/*` READMEs. */
  minimumReadmes: 36,
  /** `ts`, `tsx` and `typescript` fences across them. */
  minimumTsLikeFences: 73,
  /** Fences actually submitted to the compiler. */
  minimumChecked: 73,
  /** Fences tagged TypeScript whose body does not parse; `deno check` aborts the program on these. */
  maximumSyntaxInvalid: 0,
  /** READMEs carrying at least one type error. */
  maximumFailingReadmes: 5,
  /** Total type errors across the corpus. */
  maximumTypeErrors: 7,
} as const;

/** One README fence that could not be parsed as TypeScript. */
export interface ReadmeSyntaxFailure {
  readonly sourcePath: string;
  readonly codeStartLine: number;
}

/**
 * Census reported on every run, whether the gate passes or fails.
 *
 * `fences` counts every fenced block for context and deliberately carries **no floor**: this gate
 * polices TypeScript fences, so deleting a `bash` or `mermaid` block is out of its scope and does
 * not fail it. `exempt` likewise has no ceiling of its own — exempting a block decrements `checked`,
 * which the `minimumChecked` floor already catches.
 */
export interface ReadmeFenceCensus {
  readonly readmes: number;
  readonly fences: number;
  readonly tsLike: number;
  readonly exempt: number;
  readonly checked: number;
  readonly syntaxInvalid: number;
  readonly typeErrors: number;
  readonly failingReadmes: number;
  /**
   * The compiler reported failure that this gate could attribute to neither a type error nor an
   * excluded syntax-invalid fence. Never expected; failing on it stops an unreadable diagnostic
   * shape from being silently swallowed, which is the defect #1892 found in the sibling gate.
   */
  readonly unattributedFailure: boolean;
}

/** Return every floor or ceiling violation, so a run reports all of them rather than the first. */
export function readmeFenceRatchetFailures(census: ReadmeFenceCensus): string[] {
  const failures: string[] = [];
  const floor = (actual: number, minimum: number, label: string) => {
    if (actual < minimum) failures.push(`${label} ${actual} < ${minimum}`);
  };
  const ceiling = (actual: number, maximum: number, label: string) => {
    if (actual > maximum) failures.push(`${label} ${actual} > ${maximum}`);
  };
  floor(census.readmes, README_FENCE_RATCHET.minimumReadmes, 'readmes');
  floor(census.tsLike, README_FENCE_RATCHET.minimumTsLikeFences, 'ts-like fences');
  floor(census.checked, README_FENCE_RATCHET.minimumChecked, 'checked');
  ceiling(census.syntaxInvalid, README_FENCE_RATCHET.maximumSyntaxInvalid, 'syntax-invalid fences');
  ceiling(census.failingReadmes, README_FENCE_RATCHET.maximumFailingReadmes, 'failing readmes');
  ceiling(census.typeErrors, README_FENCE_RATCHET.maximumTypeErrors, 'type errors');
  if (census.unattributedFailure) {
    failures.push('compiler reported failure that no fence accounts for');
  }
  return failures;
}

/** Single-line census, printed on pass and fail alike so the deferred set stays visible. */
export function formatReadmeFenceCensus(
  census: ReadmeFenceCensus,
  verdict: 'PASS' | 'FAIL',
): string {
  return `readme fences: ${verdict} readmes=${census.readmes} fences=${census.fences} ` +
    `ts_like=${census.tsLike} exempt=${census.exempt} checked=${census.checked} ` +
    `syntax_invalid=${census.syntaxInvalid} type_errors=${census.typeErrors} ` +
    `failing_readmes=${census.failingReadmes} unattributed_failure=${census.unattributedFailure}`;
}
