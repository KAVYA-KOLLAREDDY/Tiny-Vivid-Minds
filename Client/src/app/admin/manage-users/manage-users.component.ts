import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { AuthService } from '../../services/auth.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface User {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  teacherProfile?: {
    qualification?: string;
    experienceYears?: number;
    specialization?: string;
    bio?: string;
  };
  studentProfile?: {
    age?: number;
    classLevel?: string;
    parentName?: string;
    contactNumber?: string;
  };
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  
  allUsers = signal<User[]>([]);
  selectedFilter = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);
  
  // Modal states
  showUserModal = signal<boolean>(false);
  showConfirmModal = signal<boolean>(false);
  showAddUserModal = signal<boolean>(false);
  selectedUser = signal<User | null>(null);
  confirmAction = signal<'approve' | 'reject' | null>(null);
  
  // Add User Form
  addUserForm!: FormGroup;
  selectedRole = signal<'teacher' | 'student'>('teacher');
  isSubmitting = signal<boolean>(false);
  defaultPassword = 'Tinyvividminds@123';
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  // Computed filtered and paginated users
  filteredUsers = computed(() => {
    let users = this.allUsers();
    
    // Apply filter
    if (this.selectedFilter() !== 'all') {
      if (this.selectedFilter() === 'teachers') {
        users = users.filter(u => u.role?.toLowerCase() === 'teacher');
      } else if (this.selectedFilter() === 'students') {
        users = users.filter(u => u.role?.toLowerCase() === 'student');
      } else if (this.selectedFilter() === 'pending') {
        users = users.filter(u => u.status?.toLowerCase() === 'pending');
      }
    }
    
    // Apply search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      users = users.filter(u => 
        u.fullName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }
    
    return users;
  });

  paginatedUsers = computed(() => {
    const users = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return users.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredUsers().length / this.itemsPerPage());
  });

  ngOnInit() {
    this.fetchUsers();
    this.initializeAddUserForm();
  }

  initializeAddUserForm() {
    this.addUserForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      // Teacher fields
      qualification: [''],
      experienceYears: [''],
      specialization: [''],
      bio: [''],
      // Student fields
      age: [''],
      classLevel: [''],
      parentName: [''],
      contactNumber: ['']
    });
  }

  fetchUsers() {
    this.isLoading.set(true);
    this.apiService.getAllUsers().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        this.allUsers.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
        // Reset to first page when data changes
        this.currentPage.set(1);
      }, () => {
        this.isLoading.set(false);
      })
    );
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
    this.currentPage.set(1);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  openUserModal(user: User) {
    // Fetch full user details if needed
    this.selectedUser.set(user);
    this.showUserModal.set(true);
  }

  closeUserModal() {
    this.showUserModal.set(false);
    this.selectedUser.set(null);
  }

  openConfirmModal(user: User, action: 'approve' | 'reject') {
    this.selectedUser.set(user);
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.selectedUser.set(null);
    this.confirmAction.set(null);
  }

  confirmActionHandler() {
    const user = this.selectedUser();
    const action = this.confirmAction();
    
    if (!user || !action) return;

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    this.apiService.updateUserStatus(user.userId, status).subscribe(
      handleResponse(this.loggingService, (data: any) => {
        this.loggingService.onSuccess(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        this.closeConfirmModal();
        this.fetchUsers();
      })
    );
  }

  getRoleDisplay(role: string): string {
    if (!role) return 'N/A';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  getStatusDisplay(status: string): string {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-unknown';
    const s = status.toLowerCase();
    if (s === 'approved') return 'status-approved';
    if (s === 'pending') return 'status-pending';
    if (s === 'rejected') return 'status-rejected';
    return 'status-unknown';
  }

  getRoleClass(role: string): string {
    if (!role) return 'role-unknown';
    const r = role.toLowerCase();
    if (r === 'admin') return 'role-admin';
    if (r === 'teacher') return 'role-teacher';
    if (r === 'student') return 'role-student';
    return 'role-unknown';
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    
    return pages;
  }

  addNewUser() {
    this.selectedRole.set('teacher');
    this.initializeAddUserForm();
    this.showAddUserModal.set(true);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
    this.addUserForm.reset();
    this.selectedRole.set('teacher');
  }

  onRoleChange(role: 'teacher' | 'student') {
    this.selectedRole.set(role);
    // Update form validators based on role
    if (role === 'teacher') {
      this.addUserForm.get('qualification')?.setValidators([Validators.required]);
      this.addUserForm.get('experienceYears')?.setValidators([Validators.required, Validators.min(0)]);
      this.addUserForm.get('specialization')?.setValidators([Validators.required]);
      this.addUserForm.get('bio')?.clearValidators();
      
      this.addUserForm.get('age')?.clearValidators();
      this.addUserForm.get('classLevel')?.clearValidators();
      this.addUserForm.get('parentName')?.clearValidators();
      this.addUserForm.get('contactNumber')?.clearValidators();
    } else {
      this.addUserForm.get('age')?.setValidators([Validators.required, Validators.min(5), Validators.max(18)]);
      this.addUserForm.get('classLevel')?.setValidators([Validators.required]);
      this.addUserForm.get('parentName')?.setValidators([Validators.required]);
      this.addUserForm.get('contactNumber')?.setValidators([Validators.required]);
      
      this.addUserForm.get('qualification')?.clearValidators();
      this.addUserForm.get('experienceYears')?.clearValidators();
      this.addUserForm.get('specialization')?.clearValidators();
      this.addUserForm.get('bio')?.clearValidators();
    }
    
    // Update validity
    Object.keys(this.addUserForm.controls).forEach(key => {
      this.addUserForm.get(key)?.updateValueAndValidity();
    });
  }

  onSubmitAddUser() {
    if (this.addUserForm.invalid) {
      this.markFormGroupTouched(this.addUserForm);
      return;
    }

    this.isSubmitting.set(true);
    const formData = { ...this.addUserForm.value };
    formData.password = this.defaultPassword;

    if (this.selectedRole() === 'teacher') {
      formData.experienceYears = parseInt(formData.experienceYears);
      this.authService.registerTeacher(formData).subscribe(
        handleResponse(this.loggingService, (data) => {
          this.loggingService.onSuccess('User created successfully with default password: Tinyvividminds@123');
          this.closeAddUserModal();
          this.fetchUsers();
          this.isSubmitting.set(false);
        }, () => {
          this.isSubmitting.set(false);
        })
      );
    } else {
      formData.age = parseInt(formData.age);
      this.authService.registerStudent(formData).subscribe(
        handleResponse(this.loggingService, (data) => {
          this.loggingService.onSuccess('User created successfully with default password: Tinyvividminds@123');
          this.closeAddUserModal();
          this.fetchUsers();
          this.isSubmitting.set(false);
        }, () => {
          this.isSubmitting.set(false);
        })
      );
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
