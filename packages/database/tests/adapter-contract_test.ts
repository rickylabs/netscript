import { createMockDatabaseAdapter, runDatabaseAdapterContract } from '../testing/mod.ts';

runDatabaseAdapterContract({
  name: 'mock database adapter',
  make: () => createMockDatabaseAdapter(),
});
