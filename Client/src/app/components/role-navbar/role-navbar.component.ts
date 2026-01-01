import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-role-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './role-navbar.component.html',
  styleUrls: ['./role-navbar.component.css'],
})
export class RoleNavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  // Get current user from auth service
  currentUser = this.authService.currentUser;

  // Get username from JWT token (adjust property name based on your JWT structure)
  username = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    // JWT typically has 'sub' (subject/username) or 'username' or 'name'
    return user.sub || user.username || user.name || user.email?.split('@')[0] || 'User';
  });

  // Check if current route is admin
  isAdminRoute = computed(() => {
    return this.router.url.startsWith('/admin');
  });

  navigateToDashboard() {
    if (this.isAdminRoute()) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.router.url.startsWith('/teacher')) {
      this.router.navigate(['/teacher']);
    } else if (this.router.url.startsWith('/student')) {
      this.router.navigate(['/student']);
    }
  }

  navigateToProfile() {
    if (this.isAdminRoute()) {
      this.router.navigate(['/admin/profile']);
    } else if (this.router.url.startsWith('/teacher')) {
      this.router.navigate(['/teacher/profile']);
    } else if (this.router.url.startsWith('/student')) {
      this.router.navigate(['/student/profile']);
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Even if logout fails on server, clear local storage and redirect
        this.router.navigate(['/auth/login']);
      },
    });
  }
}

