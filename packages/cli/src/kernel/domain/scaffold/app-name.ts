import { SCAFFOLD_VALIDATION } from '../../constants/scaffold/scaffold-validation.ts';

const WEB_APP_SUFFIX = '-web';

/** Derive the default Fresh application name from a validated project name. */
export function deriveDefaultAppName(projectName: string): string {
  if (projectName === 'web' || projectName.endsWith(WEB_APP_SUFFIX)) {
    return projectName;
  }

  const projectPrefix = projectName
    .slice(0, SCAFFOLD_VALIDATION.NAME_MAX_LENGTH - WEB_APP_SUFFIX.length)
    .replace(/-+$/, '');
  return `${projectPrefix}${WEB_APP_SUFFIX}`;
}
