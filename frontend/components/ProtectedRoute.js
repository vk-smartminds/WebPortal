"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, isTokenExpired, getToken, logout } from '../utils/auth.js';
import { BASE_API_URL } from '../pages/apiurl.js';

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ? payload.role.toLowerCase() : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Map dashboard routes to roles
  const roleDashboardMap = {
    admin: '/admin/dashboard',
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    parent: '/parent/dashboard',
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token || !isAuthenticated() || isTokenExpired(token)) {
          logout();
          router.replace('/login');
          return;
        }
        const role = getRoleFromToken(token);
        // If authenticated and on /login, redirect to dashboard
        if (pathname === '/login') {
          if (roleDashboardMap[role]) {
            router.replace(roleDashboardMap[role]);
          } else {
            router.replace('/login');
          }
          return;
        }
        // Role-based access: if on a dashboard route, only allow if role matches
        for (const [r, dash] of Object.entries(roleDashboardMap)) {
          if (pathname.startsWith(dash) && role !== r) {
            if (roleDashboardMap[role]) {
              router.replace(roleDashboardMap[role]);
            } else {
              router.replace('/login');
            }
            return;
          }
        }
        // Verify token with backend
        const response = await fetch(`${BASE_API_URL}/verify-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setIsValid(true);
        } else {
          logout();
          router.replace('/login');
        }
      } catch (error) {
        logout();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#1e3c72'
      }}>
        Loading...
      </div>
    );
  }
  return isValid ? children : null;
}