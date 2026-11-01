import { assertThrows } from '@std/assert';
import { defaultTokenSources } from '../../src/tokens/adapters/default-token-sources.ts';
import { assertRegisteredTokenNames } from '../../src/tokens/domain/check-token-names.ts';
import { resolveTokenSources } from '../../src/tokens/domain/resolve-tokens.ts';
import type { TokenDocument } from '../../src/tokens/domain/token-contract.ts';
import roleRegistry from '../../tokens/role-manifest.json' with { type: 'json' };

Deno.test('code registry rejects unknown names, omissions, duplicates and changed role types', () => {
  const base = resolveTokenSources(defaultTokenSources(), { theme: 'ns-one', scheme: 'light' });
  assertRegisteredTokenNames(base, roleRegistry);
  const unknown = structuredClone(base);
  (unknown.semantic as TokenDocument).unknown = {
    $type: 'color',
    $value: '{semantic.primary}',
    $extensions: { netscript: { cssVar: '--ns-unknown-role' } },
  };
  assertThrows(
    () => assertRegisteredTokenNames(unknown, roleRegistry),
    Error,
    'Unknown exported token name',
  );
  const missing = structuredClone(base);
  delete (missing.semantic as TokenDocument).primary;
  assertThrows(
    () => assertRegisteredTokenNames(missing, roleRegistry),
    Error,
    'Missing registered token names',
  );
  const duplicate = structuredClone(base);
  (duplicate.semantic as TokenDocument).duplicate = (duplicate.semantic as TokenDocument).primary;
  assertThrows(
    () => assertRegisteredTokenNames(duplicate, roleRegistry),
    Error,
    'Duplicate exported token name',
  );
  const changed = structuredClone(base);
  (changed.semantic as TokenDocument).primary = {
    $type: 'dimension',
    $value: '{semantic.radius-md}',
    $extensions: { netscript: { cssVar: '--ns-primary' } },
  };
  assertThrows(
    () => assertRegisteredTokenNames(changed, roleRegistry),
    Error,
    'Registered token type changed',
  );
});
