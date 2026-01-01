import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LoggingService } from '../../../services/logging.service';
import { handleResponse } from '../../../utils/handle-response.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  private authService = inject(AuthService);
  private router = inject(Router);
  private loggingService = inject(LoggingService);
  user = computed(() => this.authService.currentUser());

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService.login(credentials).subscribe(
        handleResponse(this.loggingService, (data) => {
          this.loggingService.onSuccess('Logged in successfully!');
          const authorities = this.user().authorities;
          if (authorities && authorities.includes('ROLE_ADMIN')) {
            this.router.navigate(['/admin', 'users']);
          } else if (authorities && authorities.includes('ROLE_TEACHER')) {
            this.router.navigate(['/teacher', 'students']);
          } else if (authorities && authorities.includes('ROLE_STUDENT')) {
            this.router.navigate(['/student', 'courses']);
          } else {
            this.router.navigate(['/']);
          }
        }, () => {
          this.isSubmitting = false;
        })
      );
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

