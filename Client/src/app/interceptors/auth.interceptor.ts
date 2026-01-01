import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);

  const skipAuth = ['/login', '/register', '/refresh', '/logout'];
  
  // Extract pathname from URL (handle both absolute and relative URLs)
  let urlPath: string;
  try {
    // If req.url is already a full URL, use it directly
    if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
      urlPath = new URL(req.url).pathname;
    } else {
      // If it's a relative URL, construct full URL
      urlPath = new URL(req.url, window.location.origin).pathname;
    }
  } catch {
    // Fallback: use req.url as-is if URL parsing fails
    urlPath = req.url;
  }

  // Skip auth for public endpoints (including /api/auth/** paths)
  if (skipAuth.some((endpoint) => urlPath.includes(endpoint)) || urlPath.startsWith('/api/auth/')) {
    console.log('🔓 Skipping auth for public endpoint:', urlPath);
    return next(req);
  }

  // Get the access token
  const accessToken = tokenService.getAccessToken();

  // If no token exists, proceed without Authorization header
  // (This will result in 401/403, which is expected behavior)
  if (!accessToken) {
    console.warn('No access token found for request:', req.url);
    return next(req);
  }

  // Check if token is expired
  const isExpired = tokenService.isAccessTokenExpired();

  // If token is valid, add it to the request
  if (!isExpired) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('✅ Adding Authorization header to request:', req.url);
    return next(clonedReq);
  }

  // If token is expired, try to refresh it
  if (isRefreshing) {
    return throwError(() => new Error('Refresh already in progress'));
  }

  isRefreshing = true;

  return authService.refreshAccessToken().pipe(
    switchMap(() => {
      isRefreshing = false;
      const newAccessToken = tokenService.getAccessToken();
      
      // If refresh succeeded but no new token, something went wrong
      if (!newAccessToken) {
        authService.logout();
        return throwError(() => new Error('Token refresh failed: No token received'));
      }
      
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
      return next(clonedReq);
    }),
    catchError((err) => {
      isRefreshing = false;
      console.error('Token refresh failed:', err);
      authService.logout();
      return throwError(() => err);
    })
  );
};

