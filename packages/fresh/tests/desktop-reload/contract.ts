import { os } from '@orpc/server';
import type { Procedure, Schema } from '@orpc/server';

export const reloadRouter: {
  ping: Procedure<
    Record<never, never>,
    Record<never, never>,
    Schema<unknown, unknown>,
    Schema<string, string>,
    Record<never, never>,
    Record<never, never>
  >;
} = os.router({
  ping: os.handler(() => 'native-pong'),
});
