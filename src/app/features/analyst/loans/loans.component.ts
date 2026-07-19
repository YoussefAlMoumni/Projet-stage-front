import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Loan {
  id: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: string;
  status: string;
  dossier?: { id: number; siren: string };
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss'
})
export class LoansComponent implements OnInit {
  private apiService = inject(ApiService);

  loans: Loan[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.fetchLoans();
  }

  fetchLoans(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/dossiers').subscribe({
      next: (dossiers) => {
        // Flatten all loans from all dossiers
        this.loans = dossiers.flatMap(d =>
          (d.loans || []).map((l: Loan) => ({ ...l, dossier: { id: d.id, siren: d.siren } }))
        );
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load loans.';
        this.isLoading = false;
      }
    });
  }

  monthlyPayment(loan: Loan): number {
    const r = loan.interestRate / 100 / 12;
    const n = loan.termMonths;
    if (r === 0) return loan.amount / n;
    return (loan.amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
}
