import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
  gender: string;
  role: string;
  salary: number;
  hireDate?: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
  private apiService = inject(ApiService);

  users: User[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Modal Control
  showModal = false;
  isEditMode = false;

  // Form Fields
  currentUser: User = this.getEmptyUser();

  // Validation Flags
  errors: any = {};

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.apiService.get<User[]>('/users').subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load employees.';
        this.isLoading = false;
      }
    });
  }

  getEmptyUser(): User {
    return {
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      nationalId: '',
      phoneNumber: '',
      gender: 'male',
      role: 'analyst',
      salary: 30000
    };
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUser = this.getEmptyUser();
    this.errors = {};
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.currentUser = { ...user, password: '' }; // Clear password field for edits
    this.errors = {};
    this.showModal = true;
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Username validation
    if (!this.currentUser.username || this.currentUser.username.length < 3) {
      this.errors.username = 'Username must be at least 3 characters.';
      isValid = false;
    }

    // Password validation (only on creation)
    if (!this.isEditMode) {
      const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
      if (!this.currentUser.password || !passwordRegex.test(this.currentUser.password)) {
        this.errors.password = 'Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.';
        isValid = false;
      }
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.currentUser.email || !emailRegex.test(this.currentUser.email)) {
      this.errors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // E.164 phone number validation (+ followed by 1-15 digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (this.currentUser.phoneNumber && !phoneRegex.test(this.currentUser.phoneNumber)) {
      this.errors.phoneNumber = 'Phone number must be in E.164 format (e.g., +1234567890).';
      isValid = false;
    }

    // National ID validation
    const nationalIdRegex = /^[a-zA-Z0-9-]{5,20}$/;
    if (!this.currentUser.nationalId || !nationalIdRegex.test(this.currentUser.nationalId)) {
      this.errors.nationalId = 'National ID must be between 5-20 alphanumeric characters or hyphens.';
      isValid = false;
    }

    // First Name / Last Name validation (letters, space, hyphens)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
    if (!this.currentUser.firstName || !nameRegex.test(this.currentUser.firstName)) {
      this.errors.firstName = 'First Name must be 2-50 characters (letters and hyphens only).';
      isValid = false;
    }
    if (!this.currentUser.lastName || !nameRegex.test(this.currentUser.lastName)) {
      this.errors.lastName = 'Last Name must be 2-50 characters (letters and hyphens only).';
      isValid = false;
    }

    // Salary validation
    if (this.currentUser.salary < 0) {
      this.errors.salary = 'Salary cannot be negative.';
      isValid = false;
    }

    return isValid;
  }

  saveUser(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // If edit mode and password is blank, remove it so it's not updated
    const payload = { ...this.currentUser };
    if (this.isEditMode && !payload.password) {
      delete payload.password;
    }

    if (this.isEditMode) {
      this.apiService.put<User>(`/users/${payload.id}`, payload).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully.';
          this.fetchUsers();
          this.showModal = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user.';
          this.isLoading = false;
        }
      });
    } else {
      this.apiService.post<User>('/users', payload).subscribe({
        next: () => {
          this.successMessage = 'User created successfully.';
          this.fetchUsers();
          this.showModal = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create user.';
          this.isLoading = false;
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.delete<any>(`/users/${id}`).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'User deleted.';
        this.fetchUsers();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user.';
        this.isLoading = false;
      }
    });
  }
}
