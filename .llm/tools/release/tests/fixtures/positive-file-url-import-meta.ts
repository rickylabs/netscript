import { fromFileUrl } from 'jsr:@std/path@^1';

const REPOSITORY_ROOT = fromFileUrl(new URL('../../../../../../', import.meta.url));

export function repositoryRoot(): string {
  return REPOSITORY_ROOT;
}
