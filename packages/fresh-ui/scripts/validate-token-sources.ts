import { defaultTokenSources } from '../src/tokens/adapters/default-token-sources.ts';
import { validateDtcgSources } from '../src/tokens/adapters/dtcg-validation.ts';
import {
  assertSemanticAliases,
  assertTokenReferences,
  resolveTokenSources,
} from '../src/tokens/domain/resolve-tokens.ts';
import { TOKEN_DENSITIES, TOKEN_SCHEMES } from '../src/tokens/domain/token-contract.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';
import roleRegistry from '../tokens/role-manifest.json' with { type: 'json' };
import { assertRegisteredTokenNames } from '../src/tokens/domain/check-token-names.ts';

const sources = defaultTokenSources();
validateDtcgSources(sources);
for (
  const file of [
    'semantic.tokens.json',
    'presets.tokens.json',
    'themes/light.tokens.json',
    'themes/dark.tokens.json',
  ]
) {
  assertSemanticAliases(sources.documents[file]);
}
let permutations = 0;
for (const preset of TOKEN_PRESETS) {
  for (const scheme of TOKEN_SCHEMES) {
    for (const density of TOKEN_DENSITIES) {
      const document = resolveTokenSources(sources, { theme: preset.id, scheme, density });
      assertTokenReferences(document);
      assertRegisteredTokenNames(document, roleRegistry);
      permutations++;
    }
  }
}
console.log(
  `DTCG schemas, alias-only semantics and registered names: PASS; ${permutations} resolver inputs.`,
);
