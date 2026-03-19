import { vi } from 'vitest';

// Shared mock factories for test setup

export function mockAuthContext(overrides?: Partial<{ userId: string; teamId: string; role: string }>) {
  return {
    userId: 'user-1',
    teamId: 'team-1',
    role: 'admin',
    ...overrides,
  };
}

export function mockPrisma() {
  return {
    project: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    formulation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    sampleOrder: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sampleReview: {
      create: vi.fn(),
    },
    comment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    projectAssignment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    shareLink: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      createMany: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    team: {
      create: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    document: {
      create: vi.fn(),
    },
    formulationIngredient: {},
    projectFormulation: {},
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma())),
  };
}
