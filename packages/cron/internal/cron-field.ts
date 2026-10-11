/** @internal Expand a supported numeric cron field into a bounded, ordered set. */
export function expandCronField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) return null;
    const step = match[2] === undefined ? 1 : Number(match[2]);
    if (!Number.isSafeInteger(step) || step < 1) return null;

    const range = match[1];
    const [startText, endText] = range.split('-');
    const start = range === '*' ? min : Number(startText);
    const end = range === '*' ? max : endText === undefined ? start : Number(endText);
    // A step on a lone value has provider-specific semantics; do not guess.
    if (range !== '*' && endText === undefined && match[2] !== undefined) return null;
    if (start < min || end > max || start > end) return null;
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return [...values].sort((a, b) => a - b);
}
