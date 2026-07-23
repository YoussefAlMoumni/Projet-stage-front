import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-recovery-methods',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recovery-methods.component.html',
  styleUrl: './recovery-methods.component.scss'
})
export class RecoveryMethodsComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  email = '';
  maskedPhone = '';
  hasPhone = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  otpCode: string | null = null;
  selectedMethod: 'email' | 'sms' | null = null;
  showOtpResult = false;

  constructor() {
    // Must be read in constructor — getCurrentNavigation() returns null after routing is complete
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { email: string; maskedPhone: string; hasPhone: boolean } | undefined;

    if (state?.email) {
      this.email = state.email;
      this.maskedPhone = state.maskedPhone ?? '';
      this.hasPhone = state.hasPhone ?? false;
    }
  }

  ngOnInit(): void {
    // If no email was passed via state, redirect back so user must enter email first
    if (!this.email) {
      this.router.navigate(['/forgot-password']);
    }
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

  goBack(): void {
    this.router.navigate(['/forgot-password']);
  }
}
