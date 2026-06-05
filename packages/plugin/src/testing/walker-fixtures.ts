import type { WalkedFile } from '../sdk/mod.ts';

/** Example walked file fixture. */
export function createWalkedFileFixture(path = 'plugin.ts'): WalkedFile {
  return { path, text: 'export default {};' };
}
