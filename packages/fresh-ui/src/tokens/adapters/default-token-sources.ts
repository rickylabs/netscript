import resolver from '../../../tokens/v2/tokens.resolver.json' with { type: 'json' };
import primitives from '../../../tokens/v2/primitives.tokens.json' with { type: 'json' };
import semantics from '../../../tokens/v2/semantic.tokens.json' with { type: 'json' };
import presets from '../../../tokens/v2/presets.tokens.json' with { type: 'json' };
import density from '../../../tokens/v2/density.tokens.json' with { type: 'json' };
import components from '../../../tokens/v2/component.tokens.json' with { type: 'json' };
import light from '../../../tokens/v2/themes/light.tokens.json' with { type: 'json' };
import dark from '../../../tokens/v2/themes/dark.tokens.json' with { type: 'json' };
import type { TokenSources } from '../domain/resolve-tokens.ts';

/** The same bundled sources are available in a published package and a scaffold. */
export function defaultTokenSources(): TokenSources {
  return {
    resolver,
    documents: {
      'primitives.tokens.json': primitives,
      'semantic.tokens.json': semantics,
      'presets.tokens.json': presets,
      'density.tokens.json': density,
      'component.tokens.json': components,
      'themes/light.tokens.json': light,
      'themes/dark.tokens.json': dark,
    },
  };
}
