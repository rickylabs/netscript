import { createDefine } from 'fresh';
import { definePage as createDefinePage } from '@netscript/fresh/builders';

export type State = Record<string, never>;

export const define = createDefine<State>();

export function definePage() {
  return createDefinePage<State>();
}
