import { assertEquals } from '@std/assert';
import {
  paginatedQuery,
  offsetPaginatedQuery,
  cursorPaginatedQuery,
  type PrismaModelDelegate,
} from '@netscript/contracts/query';

// A minimal Prisma-shaped delegate fixture
class MockPrismaDelegate implements PrismaModelDelegate {
  constructor(private items: Array<{ id: number; name: string; createdAt: Date }>) {}

  async findMany(args: any = {}): Promise<any[]> {
    let result = [...this.items];
    if (args.where?.name) {
      result = result.filter(item => item.name === args.where.name);
    }
    // Sorting
    if (args.orderBy) {
      const field = Object.keys(args.orderBy)[0];
      const direction = args.orderBy[field];
      result.sort((a: any, b: any) => {
        if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Cursor
    if (args.cursor) {
      const cursorVal = Number(args.cursor[args.cursorField ?? 'id']);
      const index = result.findIndex(item => item.id === cursorVal);
      if (index !== -1) {
        result = result.slice(index);
      }
    }
    // Skip / Take
    const skip = args.skip ?? 0;
    const take = args.take ?? result.length;
    result = result.slice(skip, skip + take);
    return result;
  }

  async count(args: any = {}): Promise<number> {
    let result = [...this.items];
    if (args.where?.name) {
      result = result.filter(item => item.name === args.where.name);
    }
    return result.length;
  }
}

Deno.test('contracts: page pagination (paginatedQuery)', async () => {
  const items = [
    { id: 1, name: 'Alice', createdAt: new Date('2026-01-01') },
    { id: 2, name: 'Bob', createdAt: new Date('2026-01-02') },
    { id: 3, name: 'Charlie', createdAt: new Date('2026-01-03') },
  ];
  const model = new MockPrismaDelegate(items);

  const result = await paginatedQuery<{ id: number; name: string }>(model, {
    page: 1,
    limit: 2,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  assertEquals(result.data.length, 2);
  assertEquals(result.data[0].name, 'Alice');
  assertEquals(result.pagination.total, 3);
  assertEquals(result.pagination.totalPages, 2);
  assertEquals(result.pagination.hasNext, true);
  assertEquals(result.pagination.hasPrev, false);
});

Deno.test('contracts: offset pagination (offsetPaginatedQuery)', async () => {
  const items = [
    { id: 1, name: 'Alice', createdAt: new Date('2026-01-01') },
    { id: 2, name: 'Bob', createdAt: new Date('2026-01-02') },
    { id: 3, name: 'Charlie', createdAt: new Date('2026-01-03') },
  ];
  const model = new MockPrismaDelegate(items);

  const result = await offsetPaginatedQuery<{ id: number; name: string }>(model, {
    offset: 1,
    limit: 2,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  assertEquals(result.data.length, 2);
  assertEquals(result.data[0].name, 'Bob');
  assertEquals(result.total, 3);
  assertEquals(result.hasMore, false);
});

Deno.test('contracts: cursor pagination (cursorPaginatedQuery)', async () => {
  const items = [
    { id: 1, name: 'Alice', createdAt: new Date('2026-01-01') },
    { id: 2, name: 'Bob', createdAt: new Date('2026-01-02') },
    { id: 3, name: 'Charlie', createdAt: new Date('2026-01-03') },
  ];
  const model = new MockPrismaDelegate(items);

  const result = await cursorPaginatedQuery<{ id: number; name: string }>(model, {
    limit: 2,
    direction: 'forward',
    cursorField: 'id',
  });

  assertEquals(result.data.length, 2);
  assertEquals(result.data[0].id, 1);
  assertEquals(result.nextCursor, '2');
  assertEquals(result.hasMore, true);
});
