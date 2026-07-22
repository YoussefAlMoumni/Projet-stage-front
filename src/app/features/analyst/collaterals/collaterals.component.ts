import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataStateService } from '../../../core/services/data-state.service';
import { Dossier } from '../../../core/models/types';

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
export class CollateralsComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);

  collaterals: Collateral[] = [];
  errorMessage = '';
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.dataState.dossiers$.subscribe((dossiers: Dossier[]) => {
      this.collaterals = dossiers.flatMap(d =>
        (d.loans || []).flatMap((l: any) =>
          (l.collaterals || []).map((c: any) => ({
            ...c,
            loan: { id: l.id, amount: l.amount, dossierSiren: d.siren }
          }))
        )
      );
    });

    if (this.collaterals.length === 0) {
      this.dataState.fetchDossiers(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  coverageRatio(collateral: Collateral): number {
    if (!collateral.loan?.amount || collateral.loan.amount === 0) return 0;
    return (collateral.estimatedValue / collateral.loan.amount) * 100;
  }
}
