import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Collateral {
  id: number;
  type: string;
  description: string;
  estimatedValue: number;
  valuationDate: string;
  status: string;
  loan?: { id: number; amount: number; dossierSiren: string };
}

@Component({
  selector: 'app-collaterals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collaterals.component.html',
  styleUrl: './collaterals.component.scss'
})
export class CollateralsComponent implements OnInit {
  private apiService = inject(ApiService);

  collaterals: Collateral[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.fetchCollaterals();
  }

  fetchCollaterals(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/dossiers').subscribe({
      next: (dossiers) => {
        // Flatten all collaterals from all loans from all dossiers
        this.collaterals = dossiers.flatMap(d =>
          (d.loans || []).flatMap((l: any) =>
            (l.collaterals || []).map((c: Collateral) => ({
              ...c,
              loan: { id: l.id, amount: l.amount, dossierSiren: d.siren }
            }))
          )
        );
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load collaterals.';
        this.isLoading = false;
      }
    });
  }

  coverageRatio(collateral: Collateral): number {
    if (!collateral.loan?.amount || collateral.loan.amount === 0) return 0;
    return (collateral.estimatedValue / collateral.loan.amount) * 100;
  }
}
