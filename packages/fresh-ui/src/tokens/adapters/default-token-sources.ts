import { tokenSources } from '../assets/sources.generated.ts';
import type { TokenSources } from '../domain/resolve-tokens.ts';

/** The same bundled sources are available in a published package and a scaffold. */
export function defaultTokenSources(): TokenSources {
  return { resolver: tokenSources.resolver, documents: { ...tokenSources.documents } };
}
