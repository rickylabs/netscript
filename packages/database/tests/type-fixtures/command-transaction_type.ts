import { withTransaction } from '../../mod.ts';
import type { TransactionClientPort } from '../../commands.ts';

type Tx = { project: { update(): Promise<number> } };
declare const root: TransactionClientPort<Tx> & { $connect(): Promise<void> };
await withTransaction(root, async (tx) => {
  await tx.project.update();
  // @ts-expect-error root lifecycle must not appear on the callback
  await tx.$connect();
  // @ts-expect-error nested transaction must not appear on the callback
  await tx.$transaction(async () => {});
});
