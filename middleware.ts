export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/worlds/:path*', '/world/:path*', '/settings/:path*'],
}
