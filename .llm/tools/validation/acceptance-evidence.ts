export interface AcceptanceCheckbox {
  line: number;
  index: number;
  text: string;
  checked: boolean;
  postMerge: boolean;
}

export interface AcceptanceEvidence {
  issue?: number;
  text?: string;
  boxIndex?: number;
  evidence: string;
  legacy: boolean;
}

export interface IssueSnapshot {
  number: number;
  updatedAt: string;
  bodySha256: string;
}

export interface VerdictProvenance {
  headSha: string;
  evaluatedAt: string;
  issues: IssueSnapshot[];
}

export interface EvidenceParseResult {
  entries: AcceptanceEvidence[];
  warnings: string[];
}

/** An expected authoring failure that callers should render as validation evidence, not a crash. */
export class AcceptanceEvidenceValidationError extends Error {
  readonly code = 'acceptance-evidence-invalid';

  constructor(readonly errors: string[]) {
    super(errors.join('\n'));
    this.name = 'AcceptanceEvidenceValidationError';
  }
}

const CHECKBOX_PATTERN = /^(\s*[-*]\s+\[)( |x|X)(\]\s+)(.*)$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_PATTERN = /^\s*```acceptance-evidence\s*$/i;
const EVIDENCE_HEADING = 'acceptance evidence';
const LEGACY_WARNING =
  'Deprecated legacy "## Acceptance evidence" list detected; replace it with a fenced ```acceptance-evidence YAML block.';
const NOT_YET_DONE_EVIDENCE =
  /^(?:pending\b|todo\b|tbd\b|will\s+run\b|after\s+merge\b|not\s+yet\b)/i;

export function extractClosingIssues(body: string): number[] {
  const pattern =
    /(?<![\w-])(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:(?:https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/)|#)(\d+)\b/gi;
  // GitHub does not interpret closing keywords inside fenced code blocks. Structured
  // acceptance evidence commonly contains prose such as "resolves #123", so scan
  // only the Markdown text that GitHub itself treats as closing-keyword syntax.
  const githubClosingText = body.replace(/^\s*```[^\n]*\n[\s\S]*?^\s*```\s*$/gm, '');
  return [...new Set([...githubClosingText.matchAll(pattern)].map((match) => Number(match[1])))];
}

export function acceptanceCheckboxes(body: string): AcceptanceCheckbox[] {
  const result: AcceptanceCheckbox[] = [];
  const headings: Array<{ level: number; relevant: boolean }> = [];
  for (const [lineIndex, line] of body.split(/\r?\n/).entries()) {
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      const level = heading[1].length;
      while ((headings.at(-1)?.level ?? 0) >= level) headings.pop();
      headings.push({ level, relevant: isGateHeading(stripMarkdown(heading[2])) });
    }
    const checkbox = line.match(CHECKBOX_PATTERN);
    if (!checkbox) continue;
    const text = checkbox[4].trim();
    if (!/^`?gate:/i.test(text) && !headings.some((item) => item.relevant)) continue;
    result.push({
      line: lineIndex + 1,
      index: result.length + 1,
      text,
      checked: checkbox[2].toLowerCase() === 'x',
      postMerge: /\[post-merge\]/i.test(text),
    });
  }
  return result;
}

/** Parses fenced structured evidence plus the one-release legacy list format. */
export function parseAcceptanceEvidence(markdown: string): EvidenceParseResult {
  const entries: AcceptanceEvidence[] = [];
  const warnings: string[] = [];
  const lines = markdown.split(/\r?\n/);
  let blockNumber = 0;
  for (let index = 0; index < lines.length; index++) {
    if (!FENCE_PATTERN.test(lines[index])) continue;
    blockNumber++;
    const block: string[] = [];
    for (index++; index < lines.length && !/^\s*```\s*$/.test(lines[index]); index++) {
      block.push(lines[index]);
    }
    try {
      entries.push(...parseStructuredBlock(block, blockNumber));
    } catch (error) {
      if (error instanceof AcceptanceEvidenceValidationError) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new AcceptanceEvidenceValidationError([
        `Acceptance-evidence block ${blockNumber}: ${detail}`,
      ]);
    }
  }

  let sectionLevel: number | undefined;
  for (const line of lines) {
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      const level = heading[1].length;
      if (stripMarkdown(heading[2]).toLowerCase() === EVIDENCE_HEADING) sectionLevel = level;
      else if (sectionLevel !== undefined && level <= sectionLevel) sectionLevel = undefined;
      continue;
    }
    if (sectionLevel === undefined) continue;
    const checkbox = line.match(CHECKBOX_PATTERN);
    if (!checkbox || checkbox[2].toLowerCase() !== 'x') continue;
    const separator = checkbox[4].lastIndexOf(' — ');
    if (separator < 1) continue;
    entries.push({
      text: checkbox[4].slice(0, separator).trim(),
      evidence: checkbox[4].slice(separator + 3).trim(),
      legacy: true,
    });
    if (!warnings.includes(LEGACY_WARNING)) warnings.push(LEGACY_WARNING);
  }
  return { entries, warnings };
}

export function validateEvidenceMapping(
  issue: number,
  checkboxes: AcceptanceCheckbox[],
  evidence: AcceptanceEvidence[],
): Map<number, AcceptanceEvidence> {
  const actionable = checkboxes.filter((box) => !box.postMerge);
  const unchecked = actionable.filter((box) => !box.checked);
  const scopedEvidence = evidence.filter((item) =>
    item.issue === undefined || item.issue === issue
  );
  if (actionable.length === 0 && scopedEvidence.length > 0) {
    throw new AcceptanceEvidenceValidationError([
      `Issue #${issue} has zero close-gated markdown checkboxes; remove its acceptance-evidence block or convert the issue acceptance list to markdown checkboxes.`,
    ]);
  }
  const mapping = new Map<number, AcceptanceEvidence>();
  const errors: string[] = [];
  for (const entry of scopedEvidence) {
    const box = resolveEvidenceBox(entry, actionable);
    if (!box) {
      const compared = entry.text !== undefined
        ? `exact box text "${entry.text.trim()}"`
        : `box-index ${entry.boxIndex ?? 'missing'}`;
      errors.push(
        `Issue #${issue}: no acceptance box matched ${compared}; add an entry for box "${
          entry.text ?? `#${entry.boxIndex}`
        }" using exact trimmed text or its current box-index.`,
      );
      continue;
    }
    if (mapping.has(box.index)) {
      errors.push(
        `Issue #${issue}: box "${box.text}" has duplicate evidence; keep exactly one entry for that box.`,
      );
      continue;
    }
    if (!entry.evidence.trim()) {
      errors.push(
        `Issue #${issue}: box "${box.text}" matched but evidence was empty; add a non-empty evidence value for that box.`,
      );
      continue;
    }
    if (!box.checked && evidenceAssertsNotYetDone(entry.evidence)) {
      errors.push(
        `Issue #${issue}: box "${box.text}" has not-yet-done evidence "${entry.evidence}"; supply real evidence or leave the box unchecked.`,
      );
      continue;
    }
    if (!box.checked) mapping.set(box.index, entry);
  }
  for (const box of unchecked) {
    if (!mapping.has(box.index)) {
      errors.push(
        `Issue #${issue}: unchecked box "${box.text}" has no matching evidence entry; add an entry for box "${box.text}" in a fenced acceptance-evidence block.`,
      );
    }
  }
  if (errors.length) throw new AcceptanceEvidenceValidationError(errors);
  return mapping;
}

function evidenceAssertsNotYetDone(evidence: string): boolean {
  return NOT_YET_DONE_EVIDENCE.test(evidence.replace(/^[\s\-—–*•·]+/, ''));
}

export function checkAcceptanceBoxes(body: string, indexes: ReadonlySet<number>): string {
  let gateIndex = 0;
  const relevantLines = new Set(acceptanceCheckboxes(body).map((box) => box.line));
  return body.split(/\r?\n/).map((line, lineIndex) => {
    if (!relevantLines.has(lineIndex + 1)) return line;
    gateIndex++;
    const checkbox = line.match(CHECKBOX_PATTERN);
    return checkbox && checkbox[2] === ' ' && indexes.has(gateIndex)
      ? `${checkbox[1]}x${checkbox[3]}${checkbox[4]}`
      : line;
  }).join('\n');
}

export async function bodySha256(body: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function issueSnapshot(issue: {
  number: number;
  updated_at: string;
  body: string | null;
}): Promise<IssueSnapshot> {
  return {
    number: issue.number,
    updatedAt: issue.updated_at,
    bodySha256: await bodySha256(issue.body ?? ''),
  };
}

export async function staleSnapshots(
  expected: IssueSnapshot[],
  current: Array<{ number: number; updated_at: string; body: string | null }>,
): Promise<IssueSnapshot[]> {
  const currentByNumber = new Map(
    await Promise.all(
      current.map(async (issue) => [issue.number, await issueSnapshot(issue)] as const),
    ),
  );
  return expected.filter((snapshot) => {
    const live = currentByNumber.get(snapshot.number);
    return live === undefined || live.updatedAt !== snapshot.updatedAt ||
      live.bodySha256 !== snapshot.bodySha256;
  });
}

function resolveEvidenceBox(
  entry: AcceptanceEvidence,
  boxes: AcceptanceCheckbox[],
): AcceptanceCheckbox | undefined {
  const text = entry.text;
  if (text !== undefined) return boxes.find((box) => box.text.trim() === text.trim());
  if (entry.boxIndex !== undefined) return boxes.find((box) => box.index === entry.boxIndex);
  return undefined;
}

// This intentionally accepts the documented, unambiguous YAML subset without introducing a
// runtime package dependency into CI validation: scalar `issue`, then `entries`, each with exactly
// one `box` or `box-index` and an `evidence` scalar. Quoted YAML scalars are recommended.
function parseStructuredBlock(lines: string[], blockNumber: number): AcceptanceEvidence[] {
  let issue = 0;
  const entries: AcceptanceEvidence[] = [];
  let current: Partial<AcceptanceEvidence> | undefined;
  const flush = () => {
    if (!current) return;
    if (issue < 1) {
      throw new Error('Structured acceptance evidence requires a positive issue number.');
    }
    if ((current.text === undefined) === (current.boxIndex === undefined)) {
      throw new Error(
        `Issue #${issue}: each evidence entry requires exactly one of box or box-index.`,
      );
    }
    if (current.evidence === undefined) {
      throw new Error(`Issue #${issue}: each evidence entry requires evidence.`);
    }
    entries.push({ ...current, issue, evidence: current.evidence, legacy: false });
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === 'entries:' || /^entries:\s*\[\s*\](?:\s+#.*)?$/.test(line)) {
      continue;
    }
    const field = line.match(/^-?\s*(issue|box|box-index|evidence):\s*(.*)$/);
    if (!field) throw new Error(`Invalid acceptance-evidence YAML line: ${line}`);
    const [, key, rawValue] = field;
    const value = yamlScalar(rawValue);
    if (key === 'issue') {
      issue = Number(value);
      continue;
    }
    if (/^-\s*/.test(line)) {
      flush();
      current = {};
    }
    current ??= {};
    if (key === 'box') current.text = value;
    else if (key === 'box-index') current.boxIndex = Number(value);
    else current.evidence = value;
  }
  flush();
  if (entries.length === 0) {
    const target = issue > 0 ? ` for issue #${issue}` : '';
    throw new AcceptanceEvidenceValidationError([
      `Acceptance-evidence block ${blockNumber}${target} has no entries; remove the block when the closing issue has no close-gated markdown checkboxes, or add one evidence entry per unchecked checkbox.`,
    ]);
  }
  return entries;
}

function yamlScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed) as string;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function stripMarkdown(value: string): string {
  return value.replaceAll('`', '').replace(/\s+/g, ' ').trim();
}

function isGateHeading(title: string): boolean {
  const value = title.toLowerCase();
  return value.includes('acceptance') || value.includes('definition of done') ||
    value.includes('fitness gate') || /\bgates?\b/.test(value);
}
