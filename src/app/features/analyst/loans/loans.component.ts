import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataStateService } from '../../../core/services/data-state.service';
import { Dossier } from '../../../core/models/types';

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
export class LoansComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);

  loans: Loan[] = [];
  errorMessage = '';
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.dataState.dossiers$.subscribe((dossiers: Dossier[]) => {
      this.loans = dossiers.flatMap(d =>
        (d.loans || []).map((l: any) => ({ ...l, dossier: { id: d.id, siren: d.siren } }))
      );
    });

    if (this.loans.length === 0) {
      this.dataState.fetchDossiers(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  monthlyPayment(loan: Loan): number {
    const r = loan.interestRate / 100 / 12;
    const n = loan.termMonths;
    if (r === 0) return loan.amount / n;
    return (loan.amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
}
