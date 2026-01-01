import { computed, inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (childRoute, state) => {
  const authService = inject(AuthService);
  let user = computed(() => authService.currentUser());
  if (user() != null) {
    const authorities = user().authorities;
    if (authorities && authorities.includes('ROLE_ADMIN')) {
      return true;
    }
  }
  alert('ACCESS DENIED! Admin access required.');
  return false;
};

export const adminChildGuard: CanActivateChildFn = (route, state) => {
  return adminGuard(route, state);
};

