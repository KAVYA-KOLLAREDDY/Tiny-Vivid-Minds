import { Component, inject } from '@angular/core';
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
  selector: 'app-register-teacher',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register-teacher.component.html',
  styleUrls: ['./register-teacher.component.css'],
})
export class RegisterTeacherComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  private authService = inject(AuthService);
  private router = inject(Router);
  private loggingService = inject(LoggingService);

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      qualification: ['', [Validators.required]],
      experienceYears: ['', [Validators.required, Validators.min(0)]],
      specialization: ['', [Validators.required]],
      bio: [''],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      const formData = this.registerForm.value;
      formData.experienceYears = parseInt(formData.experienceYears);

      this.authService.registerTeacher(formData).subscribe(
        handleResponse(this.loggingService, (data) => {
          this.loggingService.onSuccess('Registration successful! Please wait for admin approval.');
          this.router.navigate(['/auth/login']);
        }, () => {
          this.isSubmitting = false;
        })
      );
    } else {
      this.markFormGroupTouched(this.registerForm);
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

