import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DataStateService } from '../../../core/services/data-state.service';
import { User } from '../../../core/models/types';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);
  private apiService = inject(ApiService);

  users: User[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private sub?: Subscription;

  // Modal Control
  showModal = false;
  isEditMode = false;

  // Form Fields
  currentUser: User = this.getEmptyUser();

  // Validation Flags
  errors: any = {};

  ngOnInit(): void {
    this.sub = this.dataState.users$.subscribe(data => {
      this.users = data;
    });

    if (this.users.length === 0) {
      this.dataState.fetchUsers(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  getEmptyUser(): User {
    return {
      fired: false,
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
      // Optimistic update
      this.dataState.updateUserOptimistically(payload);
      this.showModal = false;
      
      this.apiService.put<User>(`/users/${payload.id}`, payload).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully.';
          this.dataState.fetchUsers(true); // Sync real state
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user.';
          this.dataState.fetchUsers(true); // Revert on failure
          this.isLoading = false;
        }
      });
    } else {
      // Optimistic update with fake ID
      const tempUser = { ...payload, id: Date.now() };
      this.dataState.addUserOptimistically(tempUser);
      this.showModal = false;

      this.apiService.post<User>('/users', payload).subscribe({
        next: () => {
          this.successMessage = 'User created successfully.';
          this.dataState.fetchUsers(true);
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create user.';
          this.dataState.fetchUsers(true);
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

    // Optimistic delete
    this.dataState.removeUserOptimistically(id);

    this.apiService.delete<any>(`/users/${id}`).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'User deleted.';
        this.dataState.fetchUsers(true);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user.';
        this.dataState.fetchUsers(true); // Revert
        this.isLoading = false;
      }
    });
  }
}
