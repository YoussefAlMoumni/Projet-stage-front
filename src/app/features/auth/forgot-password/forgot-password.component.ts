import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private refreshInterval: any;

  email = '';
  step = 1;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Returned from Step 1 check
  maskedPhone = '';
  hasPhone = false;

  // Selected method for Step 2
  selectedMethod: 'email' | 'sms' | null = null;
  otpCode: string | null = null;
  showOtpResult = false;

  // Contact Admin modal state
  showContactModal = false;
  contactName = '';
  contactEmail = '';
  contactMessage = '';

  checkEmail(): void {
    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.post<any>('/auth/forgot-password', { email: this.email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.maskedPhone = res.phoneNumber || '';
        this.hasPhone = res.hasPhone || false;
        this.step = 2;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 429) {
          this.errorMessage = 'Too many requests. Please try again in 15 minutes.';
        } else {
          this.errorMessage = err.error?.message || 'Email address not found.';
        }
      }
    });
  }

  sendOtp(method: 'email' | 'sms'): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedMethod = method;

    this.apiService.post<any>('/auth/forgot-password', { email: this.email, method }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.otpCode = res.otp || '123456';
        this.successMessage = `Simulated OTP code sent via ${method.toUpperCase()}.`;
        this.showOtpResult = true;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 429) {
          this.errorMessage = 'Too many attempts. Please try again in 15 minutes.';
        } else {
          this.errorMessage = 'Failed to trigger OTP delivery.';
        }
      }
    });
  }

  contactAdmin(): void {
    if (!this.contactEmail.trim() || !this.contactMessage.trim()) {
      alert('Please fill out the contact form completely.');
      return;
    }
    this.isLoading = true;
    this.apiService.post<any>('/auth/contact-admin', {
      name: this.contactName,
      email: this.contactEmail,
      message: this.contactMessage
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showContactModal = false;
        alert('IT Department contacted successfully. We will review your request.');
        this.contactName = '';
        this.contactEmail = '';
        this.contactMessage = '';
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to submit message to the IT Department.');
      }
    });
  }

  ngOnInit(): void {
    // Dynamic UI refresh to clear messages automatically
    this.refreshInterval = setInterval(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
      if (this.successMessage) {
        this.successMessage = '';
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}
