import { assertEquals } from '@std/assert';
import {
  cursorPaginatedQuery,
  offsetPaginatedQuery,
  paginatedQuery,
  type PrismaModelDelegate,
} from '@netscript/contracts/query';

type MockItem = Readonly<{ id: number; name: string; createdAt: Date }>;
type MockItemKey = keyof MockItem;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMockItemKey(value: unknown): value is MockItemKey {
  return value === 'id' || value === 'name' || value === 'createdAt';
}

function compareItems(left: MockItem, right: MockItem, field: MockItemKey): number {
  switch (field) {
    case 'id':
      return left.id - right.id;
    case 'name':
      return left.name.localeCompare(right.name);
    case 'createdAt':
      return left.createdAt.getTime() - right.createdAt.getTime();
  }
}

// A minimal Prisma-shaped delegate fixture
class MockPrismaDelegate implements PrismaModelDelegate {
  constructor(private items: MockItem[]) {}

  async findMany(args: unknown = {}): Promise<MockItem[]> {
    const input = isRecord(args) ? args : {};
    const where = isRecord(input.where) ? input.where : {};
    let result = [...this.items];
    if (typeof where.name === 'string') {
      result = result.filter((item) => item.name === where.name);
    }
    // Sorting
    const orderBy = isRecord(input.orderBy) ? Object.entries(input.orderBy)[0] : undefined;
    if (orderBy) {
      const [field, direction] = orderBy;
      if (isMockItemKey(field) && (direction === 'asc' || direction === 'desc')) {
        result.sort((left, right) => {
          const comparison = compareItems(left, right, field);
          return direction === 'asc' ? comparison : -comparison;
        });
      }
    }
    // Cursor
    const cursor = isRecord(input.cursor) ? input.cursor : undefined;
    const cursorField = isMockItemKey(input.cursorField) ? input.cursorField : 'id';
    if (cursor) {
      const cursorValue = cursor[cursorField];
      const index = result.findIndex((item) => String(item[cursorField]) === String(cursorValue));
      if (index !== -1) {
        result = result.slice(index);
      }
    }
    // Skip / Take
    const skip = typeof input.skip === 'number' ? input.skip : 0;
    const take = typeof input.take === 'number' ? input.take : result.length;
    result = result.slice(skip, skip + take);
    return result;
  }

  async count(args: unknown = {}): Promise<number> {
    const input = isRecord(args) ? args : {};
    const where = isRecord(input.where) ? input.where : {};
    let result = [...this.items];
    if (typeof where.name === 'string') {
      result = result.filter((item) => item.name === where.name);
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
