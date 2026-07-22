import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { Dossier } from '../../core/models/types';

interface DashboardStats {
  totalDossiers: number;
  pendingDossiers: number;
  approvedDossiers: number;
  totalLoanVolume: number;
  totalCollateralValue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats: DashboardStats = {
    totalDossiers: 0,
    pendingDossiers: 0,
    approvedDossiers: 0,
    totalLoanVolume: 0,
    totalCollateralValue: 0
  };
  recentDossiers: Dossier[] = [];
  
  username = '';
  role = '';
  private sub?: Subscription;

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.username = user?.username || 'User';
    this.role = user?.role || '';
    
    // Subscribe to central state
    this.sub = this.dataState.dossiers$.subscribe(dossiers => {
      this.calculateStats(dossiers);
    });

    // Make sure data is fetched at least once if empty
    if (this.recentDossiers.length === 0) {
      this.dataState.fetchDossiers(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private calculateStats(dossiers: Dossier[]): void {
    this.stats.totalDossiers = dossiers.length;
    this.stats.pendingDossiers = dossiers.filter(d => d.status === 'in_progress').length;
    this.stats.approvedDossiers = dossiers.filter(d => d.status === 'approved').length;
    this.stats.totalLoanVolume = dossiers.reduce((sum, d) =>
      sum + (d.loans || []).reduce((s: number, l: any) => s + (l.amount || 0), 0), 0);
    this.stats.totalCollateralValue = dossiers.reduce((sum, d) =>
      sum + (d.loans || []).reduce((ls: number, l: any) =>
        ls + (l.collaterals || []).reduce((cs: number, c: any) => cs + (c.estimatedValue || 0), 0), 0), 0);
    this.recentDossiers = dossiers.slice(0, 5);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
