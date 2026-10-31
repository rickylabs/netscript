import { formFixtures, formKeyboard } from './utility-forms.tsx';
import { actionFixtures, actionKeyboard } from './utility-actions.tsx';
import { componentContracts } from '../../contracts.ts';
import { basicFixtures } from './utility-basic.tsx';
import { compositeFixtures } from './utility-composites.tsx';
import { proseFixture } from './utility-prose.ts';
import type { ContractStyleProvider } from './style-provider.ts';

/** Source-style IDs; CSS support items and token-only presets are separate axes. */
export const registeredContractStyles: readonly string[] = ['Utility'];

/** Add every real source-style provider here; no test module owns registration. */
export const contractStyleProviders: readonly ContractStyleProvider[] = [{
  style: 'Utility',
  contracts: componentContracts.components,
  fixtures: [
    ...basicFixtures,
    ...compositeFixtures,
    ...actionFixtures,
    ...formFixtures,
    proseFixture,
  ],
  keyboard: [...actionKeyboard, ...formKeyboard],
}];
