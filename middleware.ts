import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth bypassed for preview/review deploy
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
