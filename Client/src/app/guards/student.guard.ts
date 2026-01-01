import { computed, inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const studentGuard: CanActivateFn = (childRoute, state) => {
  const authService = inject(AuthService);
  let user = computed(() => authService.currentUser());
  if (user() != null) {
    const authorities = user().authorities;
    if (authorities && (authorities.includes('ROLE_STUDENT') || authorities.includes('ROLE_ADMIN'))) {
      return true;
    }
  }
  alert('ACCESS DENIED! Student access required.');
  return false;
};

export const studentChildGuard: CanActivateChildFn = (route, state) => {
  return studentGuard(route, state);
};

