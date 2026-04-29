import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Custom hook to handle authentication and role-based redirects
 * @param {string|string[]} requiredRole - The role(s) required to access the current page
 * @param {string} fallbackPath - Optional fallback path if role doesn't match (defaults to login)
 */
export const useAuthRedirect = (requiredRole, fallbackPath = '/login') => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while session is loading
    if (status === 'loading') return;

    // If no session, redirect to login
    if (!session) {
      router.replace('/login');
      return;
    }
    
    // If user has a role but it doesn't match the required role
    const userRole = session?.user?.role;
    if (userRole && userRole !== requiredRole) {
      // Redirect to the appropriate dashboard based on their actual role
      let dashboardPath;
      
      // Handle team members and affiliates - they use admin dashboard
      if (userRole === 'team-member' || userRole === 'affiliate') {
        dashboardPath = '/admin-dashboard';
      } else if (userRole === 'restaurant') {
        dashboardPath = '/restaurant/dashboard';
      } else if (userRole === 'shop-owner') {
        dashboardPath = '/shop/dashboard';
      } else if (userRole === 'provider') {
        dashboardPath = '/provider/dashboard';
      } else {
        dashboardPath = `/${userRole}-dashboard`;
      }
      
      // Validate that the role is a known role before redirecting
      const validRoles = ['admin', 'affiliate', 'visitor', 'shop-owner', 'restaurant', 'provider', 'team-member'];
      if (validRoles.includes(userRole)) {
        router.replace(dashboardPath);
      } else {
        // If role is unknown, redirect to login
        router.replace('/login');
      }
      return;
    }

    // If user has no role or role is undefined, redirect to login
    if (!session?.user?.role) {
      router.replace('/login');
      return;
    }

  }, [session, status, router, requiredRole, fallbackPath]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    hasCorrectRole: session?.user?.role === requiredRole
  };
};
