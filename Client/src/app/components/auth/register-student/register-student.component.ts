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
  selector: 'app-register-student',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register-student.component.html',
  styleUrls: ['./register-student.component.css'],
})
export class RegisterStudentComponent {
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
      age: ['', [Validators.required, Validators.min(5), Validators.max(18)]],
      classLevel: ['', [Validators.required]],
      parentName: ['', [Validators.required]],
      contactNumber: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      const formData = this.registerForm.value;
      formData.age = parseInt(formData.age);

      this.authService.registerStudent(formData).subscribe(
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

