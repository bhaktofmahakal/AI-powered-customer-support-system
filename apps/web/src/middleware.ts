import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Allow API routes to pass through - they have their own auth middleware
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return true;
      }

      // Allow if testAuth query param is present (for demo/testing)
      if (req.nextUrl.searchParams.get('testAuth') === 'true') {
        return true;
      }

      // Otherwise require token for page routes
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
  ],
};
