import { fromFileUrl } from 'jsr:@std/path@^1';

export function resolveRepositoryRoot(): string | null {
  const repositoryRootUrl = new URL('../../../../../../', import.meta.url);
  if (repositoryRootUrl.protocol !== 'file:') {
    return null;
  }
  return fromFileUrl(repositoryRootUrl);
}
