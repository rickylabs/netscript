import { statsGridFixtures, statsGridKeyboard } from './utility-stats-grid.tsx';
import { shellFixtures, shellKeyboard } from './utility-shell.tsx';
import { resizableFixtures, resizableKeyboard } from './utility-resizable.tsx';
import { nativeLayoutFixtures, nativeLayoutKeyboard } from './utility-native-layout.tsx';
import { pageHeaderFixtures, pageHeaderKeyboard } from './utility-page-header.tsx';
import { commandPaletteFixtures, commandPaletteKeyboard } from './utility-command-palette.tsx';
import { alertFixtures, alertKeyboard } from './utility-alert.tsx';
import { docsPrimitiveFixtures, docsPrimitiveKeyboard } from './utility-docs-primitives.tsx';
import { codeBlockFixtures, codeBlockKeyboard } from './utility-code-block.tsx';
import { displayMotionFixtures, displayMotionKeyboard } from './utility-display-motion.tsx';
import { displayBasicFixtures, displayBasicKeyboard } from './utility-display-basics.tsx';
import { overlayFixtures, overlayKeyboard } from './utility-overlays.tsx';
import { navigationFixtures, navigationKeyboard } from './utility-navigation.tsx';
import { calendarFixtures, calendarKeyboard } from './utility-calendar.tsx';
import { formFixtures, formKeyboard } from './utility-forms.tsx';
import { actionFixtures, actionKeyboard } from './utility-actions.tsx';
import { componentContracts } from '../../contracts.ts';
import { basicFixtures } from './utility-basic.tsx';
import { compositeFixtures } from './utility-composites.tsx';
import { proseFixture, proseKeyboard } from './utility-prose.ts';
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
    ...calendarFixtures,
    ...navigationFixtures,
    ...overlayFixtures,
    ...displayBasicFixtures,
    ...displayMotionFixtures,
    ...codeBlockFixtures,
    ...docsPrimitiveFixtures,
    ...alertFixtures,
    ...commandPaletteFixtures,
    ...pageHeaderFixtures,
    ...nativeLayoutFixtures,
    ...resizableFixtures,
    ...shellFixtures,
    ...statsGridFixtures,
    proseFixture,
  ],
  keyboard: [
    ...actionKeyboard,
    ...formKeyboard,
    ...calendarKeyboard,
    ...navigationKeyboard,
    ...overlayKeyboard,
    ...displayBasicKeyboard,
    ...displayMotionKeyboard,
    ...codeBlockKeyboard,
    ...docsPrimitiveKeyboard,
    ...alertKeyboard,
    ...commandPaletteKeyboard,
    ...pageHeaderKeyboard,
    ...nativeLayoutKeyboard,
    ...resizableKeyboard,
    ...shellKeyboard,
    ...statsGridKeyboard,
    ...proseKeyboard,
  ],
}];
