import type { Theme } from './args.ts';

export interface ShotResult {
  route: string;
  theme: Theme;
  file: string;
  windowNSOne: boolean;
  consoleErrors: string[];
  failedRequests: string[];
  unresolvedHoles: string[];
}

/** Reports whether a screenshot result violates the canvas render contract. */
export function isDefective(result: ShotResult): boolean {
  return !result.windowNSOne || result.consoleErrors.length > 0 ||
    result.failedRequests.length > 0 || result.unresolvedHoles.length > 0;
}

/** Classifies the process exit code for a complete screenshot run. */
export function defectExitCode(results: ShotResult[], allowDefects: boolean): number {
  return !allowDefects && results.some(isDefective) ? 1 : 0;
}

/** Finds every unfilled design-template hole still present in rendered markup. */
export function unresolvedHoles(html: string): string[] {
  return html.match(/{{[\s\S]*?}}/g) ?? [];
}
