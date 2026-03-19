import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const { mockPrismaClient } = vi.hoisted(() => ({
  mockPrismaClient: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    team: { create: vi.fn() },
    teamMember: { create: vi.fn() },
    invitation: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error { type = 'AuthError'; },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed-password')),
    compare: vi.fn(),
  },
}));

import { registerAction } from '@/lib/actions/auth';

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    mockPrismaClient.user.create.mockResolvedValue({ id: 'new-user' });
    mockPrismaClient.team.create.mockResolvedValue({ id: 'new-team' });
  });

  function formData(fields: Record<string, string>) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    return fd;
  }

  describe('input validation', () => {
    it('rejects missing name', async () => {
      const result = await registerAction(formData({ email: 'a@b.com', password: 'ValidPass123!' }));
      expect(result).toEqual({ error: 'All fields are required' });
    });

    it('rejects missing email', async () => {
      const result = await registerAction(formData({ name: 'Test', password: 'ValidPass123!' }));
      expect(result).toEqual({ error: 'All fields are required' });
    });

    it('rejects missing password', async () => {
      const result = await registerAction(formData({ name: 'Test', email: 'a@b.com' }));
      expect(result).toEqual({ error: 'All fields are required' });
    });
  });

  describe('password policy', () => {
    it('rejects passwords shorter than 12 characters', async () => {
      const result = await registerAction(formData({ name: 'Test', email: 'a@b.com', password: 'Short1' }));
      expect(result).toEqual({ error: 'Password must be at least 12 characters' });
    });

    it('rejects passwords without uppercase', async () => {
      const result = await registerAction(formData({ name: 'Test', email: 'a@b.com', password: 'alllowercase1' }));
      expect(result).toEqual({ error: 'Password must include uppercase, lowercase, and a number' });
    });

    it('rejects passwords without lowercase', async () => {
      const result = await registerAction(formData({ name: 'Test', email: 'a@b.com', password: 'ALLUPPERCASE1' }));
      expect(result).toEqual({ error: 'Password must include uppercase, lowercase, and a number' });
    });

    it('rejects passwords without numbers', async () => {
      const result = await registerAction(formData({ name: 'Test', email: 'a@b.com', password: 'NoNumbersHere' }));
      expect(result).toEqual({ error: 'Password must include uppercase, lowercase, and a number' });
    });
  });

  describe('duplicate email', () => {
    it('rejects registration with existing email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'existing' });
      const result = await registerAction(formData({ name: 'Test', email: 'existing@b.com', password: 'ValidPass123!' }));
      expect(result).toEqual({ error: 'An account with this email already exists' });
    });
  });
});

// Rate limiter test — we test the exported loginAction
import { loginAction } from '@/lib/actions/auth';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

describe('loginAction rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows up to 5 login attempts', async () => {
    const mocked = vi.mocked(signIn);
    mocked.mockRejectedValue(new AuthError('Invalid credentials'));

    const fd = new FormData();
    fd.set('email', 'ratelimit@test.com');
    fd.set('password', 'wrong');

    // First 5 should not be rate limited (they'll fail auth but that's OK)
    for (let i = 0; i < 5; i++) {
      const result = await loginAction(fd);
      // These return auth errors, not rate limit errors
      expect(result?.error).not.toContain('Too many');
    }

    // 6th attempt should be rate limited
    const result = await loginAction(fd);
    expect(result).toEqual({ error: 'Too many login attempts. Please wait 60 seconds and try again.' });
  });
});
