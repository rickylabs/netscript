import { createDefine } from 'fresh';

export interface State {
  probeRun?: string;
}

export const define = createDefine<State>();
