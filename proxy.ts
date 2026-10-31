import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/me'];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPaths.includes(path) || path.startsWith('/_next') || path === '/favicon.ico') {
    return NextResponse.next();
  }
  if (!request.cookies.get('financeflow_session')?.value) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\.).*)'],
};
