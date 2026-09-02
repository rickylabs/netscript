/** TypeScript-like fence tags compiled by the documentation snippet gate. */
export const CHECKED_LANGUAGES = ['ts', 'tsx', 'typescript'] as const;

/** A recognized documentation fence language. */
export type CheckedLanguage = (typeof CHECKED_LANGUAGES)[number];

/** Stable source provenance and content for one fenced documentation block. */
export interface FencedBlock {
  sourcePath: string;
  fenceOrdinal: number;
  openingLine: number;
  codeStartLine: number;
  closingLine: number;
  delimiter: '`' | '~';
  delimiterLength: number;
  infoString: string;
  language: string;
  checkedLanguage?: CheckedLanguage;
  compilationExtension?: 'ts' | 'tsx';
  exemptionReason?: string;
  body: string;
}

const OPENING_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const REASONED_MARKER = /^(ts|tsx|typescript)[ \t]+no-check:[ \t]*(\S(?:.*\S)?)[ \t]*$/;

function isCheckedLanguage(value: string): value is CheckedLanguage {
  return (CHECKED_LANGUAGES as readonly string[]).includes(value);
}

function classifyInfoString(
  infoString: string,
  sourcePath: string,
  openingLine: number,
): Pick<FencedBlock, 'language' | 'checkedLanguage' | 'compilationExtension' | 'exemptionReason'> {
  const language = infoString.split(/[ \t]/, 1)[0] ?? '';
  if (!isCheckedLanguage(language)) return { language };

  const compilationExtension = language === 'tsx' ? 'tsx' : 'ts';
  if (infoString === language) return { language, checkedLanguage: language, compilationExtension };

  const marker = REASONED_MARKER.exec(infoString);
  if (marker) {
    return {
      language,
      checkedLanguage: language,
      compilationExtension,
      exemptionReason: marker[2].trim(),
    };
  }

  const reasonHint = infoString.includes('no-check')
    ? 'expected no-check:<nonblank reason>'
    : 'extra fence attributes are not allowed';
  throw new Error(`${sourcePath}:${openingLine}: malformed ${language} fence: ${reasonHint}`);
}

/** Extract Markdown/Vento fences with stable source provenance and strict TS marker validation. */
export function extractFencedBlocks(source: string, sourcePath: string): FencedBlock[] {
  const lines = source.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const blocks: FencedBlock[] = [];

  for (let index = 0; index < lines.length; index++) {
    const opening = OPENING_FENCE.exec(lines[index]);
    if (!opening) continue;

    const fence = opening[1];
    const delimiter = fence[0] as '`' | '~';
    const delimiterLength = fence.length;
    const infoString = opening[2].trim();
    const openingLine = index + 1;
    const classification = classifyInfoString(infoString, sourcePath, openingLine);
    const bodyStart = index + 1;
    let closingIndex = -1;

    for (let candidate = bodyStart; candidate < lines.length; candidate++) {
      const closing = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(lines[candidate]);
      if (!closing || closing[1][0] !== delimiter || closing[1].length < delimiterLength) continue;

      const trailing = closing[2].trim();
      if (trailing.length === 0) {
        closingIndex = candidate;
        break;
      }
      if (trailing.includes('no-check')) {
        throw new Error(
          `${sourcePath}:${candidate + 1}: no-check marker belongs on the opening fence`,
        );
      }
    }

    if (closingIndex < 0) {
      throw new Error(
        `${sourcePath}:${openingLine}: unclosed ${delimiter.repeat(delimiterLength)} fence`,
      );
    }

    blocks.push({
      sourcePath,
      fenceOrdinal: blocks.length + 1,
      openingLine,
      codeStartLine: openingLine + 1,
      closingLine: closingIndex + 1,
      delimiter,
      delimiterLength,
      infoString,
      ...classification,
      body: lines.slice(bodyStart, closingIndex).join('\n'),
    });
    index = closingIndex;
  }

  return blocks;
}
