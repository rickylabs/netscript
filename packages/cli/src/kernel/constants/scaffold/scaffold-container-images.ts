import { SCAFFOLD_VERSIONS } from './scaffold-versions.ts';

/** Cache image ownership shared by AppHost generation and CI image preparation. */
export const SCAFFOLD_CACHE_CONTAINER_IMAGES: Readonly<
  Record<string, { readonly image: string; readonly tag: string }>
> = {
  Redis: { image: 'docker.io/library/redis', tag: '7' },
  Garnet: { image: 'ghcr.io/microsoft/garnet', tag: SCAFFOLD_VERSIONS.GARNET_TOOL },
}
