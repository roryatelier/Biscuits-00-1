import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedirect, mockNext } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockNext: vi.fn(() => ({ type: 'next' })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => {
      mockRedirect(...args);
      return { type: 'redirect' };
    },
    next: () => mockNext(),
  },
}));

import { middleware } from '@/middleware';

function createRequest(pathname: string, hasCookie = false) {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      has: (name: string) => {
        if (!hasCookie) return false;
        return name === 'authjs.session-token' || name === '__Secure-authjs.session-token';
      },
    },
  } as unknown as Parameters<typeof middleware>[0];
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('public routes — no auth required', () => {
    it('allows /login through without cookie check', () => {
      middleware(createRequest('/login'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows /register through', () => {
      middleware(createRequest('/register'));
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows /share/[token] through', () => {
      middleware(createRequest('/share/abc123'));
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows /api/auth routes through', () => {
      middleware(createRequest('/api/auth/callback/credentials'));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('protected routes — auth required', () => {
    it('redirects to /login when no session cookie', () => {
      middleware(createRequest('/dashboard', false));
      expect(mockRedirect).toHaveBeenCalled();
    });

    it('allows through when session cookie exists', () => {
      middleware(createRequest('/dashboard', true));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('redirects /projects when no session cookie', () => {
      middleware(createRequest('/projects', false));
      expect(mockRedirect).toHaveBeenCalled();
    });

    it('redirects /samples when no session cookie', () => {
      middleware(createRequest('/samples', false));
      expect(mockRedirect).toHaveBeenCalled();
    });

    it('includes callbackUrl in redirect', () => {
      middleware(createRequest('/projects/some-id', false));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.toString()).toContain('/login');
      expect(redirectUrl.toString()).toContain('callbackUrl');
    });
  });
});
