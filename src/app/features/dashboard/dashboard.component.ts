import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

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
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats: DashboardStats = {
    totalDossiers: 0,
    pendingDossiers: 0,
    approvedDossiers: 0,
    totalLoanVolume: 0,
    totalCollateralValue: 0
  };
  recentDossiers: any[] = [];
  isLoading = false;
  username = '';
  role = '';

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.username = user?.username || 'User';
    this.role = user?.role || '';
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/dossiers').subscribe({
      next: (dossiers) => {
        this.stats.totalDossiers = dossiers.length;
        this.stats.pendingDossiers = dossiers.filter(d => d.status === 'in_progress').length;
        this.stats.approvedDossiers = dossiers.filter(d => d.status === 'approved').length;
        this.stats.totalLoanVolume = dossiers.reduce((sum, d) =>
          sum + (d.loans || []).reduce((s: number, l: any) => s + (l.amount || 0), 0), 0);
        this.stats.totalCollateralValue = dossiers.reduce((sum, d) =>
          sum + (d.loans || []).reduce((ls: number, l: any) =>
            ls + (l.collaterals || []).reduce((cs: number, c: any) => cs + (c.estimatedValue || 0), 0), 0), 0);
        this.recentDossiers = dossiers.slice(0, 5);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
