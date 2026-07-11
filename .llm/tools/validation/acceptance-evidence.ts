export interface AcceptanceCheckbox {
  line: number;
  text: string;
  checked: boolean;
}

export interface AcceptanceEvidence {
  text: string;
  evidence: string;
}

const CHECKBOX_PATTERN = /^(\s*[-*]\s+\[)( |x|X)(\]\s+)(.*)$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const EVIDENCE_HEADING = 'acceptance evidence';

export function extractClosingIssues(body: string): number[] {
  const pattern =
    /\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:(?:https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/)|#)(\d+)\b/gi;
  return [...new Set([...body.matchAll(pattern)].map((match) => Number(match[1])))];
}

export function acceptanceCheckboxes(body: string): AcceptanceCheckbox[] {
  const result: AcceptanceCheckbox[] = [];
  const headings: Array<{ level: number; relevant: boolean }> = [];
  for (const [index, line] of body.split(/\r?\n/).entries()) {
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      const level = heading[1].length;
      while (headings.at(-1)?.level && headings.at(-1)!.level >= level) headings.pop();
      headings.push({ level, relevant: isGateHeading(stripMarkdown(heading[2])) });
    }
    const checkbox = line.match(CHECKBOX_PATTERN);
    if (!checkbox) continue;
    const text = checkbox[4].trim();
    if (!/^`?gate:/i.test(text) && !headings.some((item) => item.relevant)) continue;
    result.push({ line: index + 1, text, checked: checkbox[2].toLowerCase() === 'x' });
  }
  return result;
}

export function parseAcceptanceEvidence(markdown: string): AcceptanceEvidence[] {
  const result: AcceptanceEvidence[] = [];
  let sectionLevel: number | undefined;
  for (const line of markdown.split(/\r?\n/)) {
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
    result.push({
      text: checkbox[4].slice(0, separator).trim(),
      evidence: checkbox[4].slice(separator + 3).trim(),
    });
  }
  return result;
}

export function validateEvidenceMapping(
  checkboxes: AcceptanceCheckbox[],
  evidence: AcceptanceEvidence[],
): Map<string, AcceptanceEvidence> {
  const unchecked = new Set(checkboxes.filter((box) => !box.checked).map((box) => box.text));
  const mapping = new Map<string, AcceptanceEvidence>();
  const errors: string[] = [];
  for (const entry of evidence) {
    if (!unchecked.has(entry.text)) errors.push(`Evidence names no unchecked box: ${entry.text}`);
    else if (mapping.has(entry.text)) errors.push(`Duplicate evidence: ${entry.text}`);
    else if (!entry.evidence) errors.push(`Evidence is empty: ${entry.text}`);
    else mapping.set(entry.text, entry);
  }
  for (const text of unchecked) if (!mapping.has(text)) errors.push(`Missing evidence: ${text}`);
  if (errors.length) throw new Error(errors.join('\n'));
  return mapping;
}

export function checkAcceptanceBoxes(body: string, texts: ReadonlySet<string>): string {
  return body.split(/\r?\n/).map((line) => {
    const checkbox = line.match(CHECKBOX_PATTERN);
    return checkbox && checkbox[2] === ' ' && texts.has(checkbox[4].trim())
      ? `${checkbox[1]}x${checkbox[3]}${checkbox[4]}`
      : line;
  }).join('\n');
}

function stripMarkdown(value: string): string {
  return value.replaceAll('`', '').replace(/\s+/g, ' ').trim();
}

function isGateHeading(title: string): boolean {
  const value = title.toLowerCase();
  return value.includes('acceptance') || value.includes('definition of done') ||
    value.includes('fitness gate') || /\bgates?\b/.test(value);
}
