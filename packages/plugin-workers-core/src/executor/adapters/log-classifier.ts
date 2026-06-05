import type { TaskLogEntry } from '../../abstracts/mod.ts';

/** Classify subprocess output into worker log severity. */
export function classifyTaskLog(
  line: string,
  _source: TaskLogEntry['source'],
): TaskLogEntry['severity'] {
  const lowerLine = line.toLowerCase();
  if (
    lowerLine.includes('error:') ||
    lowerLine.includes('exception:') ||
    lowerLine.includes('fatal:') ||
    lowerLine.includes('failed:') ||
    lowerLine.includes('traceback') ||
    /^error\b/i.test(line)
  ) {
    return 'error';
  }
  if (
    lowerLine.includes('warning:') ||
    lowerLine.includes('warn:') ||
    lowerLine.includes('deprecat') ||
    /^warn(ing)?\b/i.test(line)
  ) {
    return 'warn';
  }
  if (lowerLine.includes('debug:') || lowerLine.includes('[debug]') || /^debug\b/i.test(line)) {
    return 'debug';
  }
  return 'info';
}
