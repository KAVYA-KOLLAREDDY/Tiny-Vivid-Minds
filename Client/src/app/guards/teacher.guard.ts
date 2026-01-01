import { computed, inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const teacherGuard: CanActivateFn = (childRoute, state) => {
  const authService = inject(AuthService);
  let user = computed(() => authService.currentUser());
  if (user() != null) {
    const authorities = user().authorities;
    if (authorities && (authorities.includes('ROLE_TEACHER') || authorities.includes('ROLE_ADMIN'))) {
      return true;
    }
  }
  alert('ACCESS DENIED! Teacher access required.');
  return false;
};

export const teacherChildGuard: CanActivateChildFn = (route, state) => {
  return teacherGuard(route, state);
};

