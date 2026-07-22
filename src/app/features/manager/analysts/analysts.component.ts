import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Analyst {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  fired: boolean;
}

interface AnalystPerformance {
  analyst: Analyst;
  totalDossiers: number;
  completedDossiers: number;
  performanceScore: number;
}

@Component({
  selector: 'app-analysts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysts.component.html',
  styleUrl: './analysts.component.scss'
})
export class AnalystsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  performances: AnalystPerformance[] = [];
  isLoading = false;
  isBackgroundSyncing = false;
  errorMessage = '';

  isLiveSyncEnabled = true;
  lastSyncTime: Date = new Date();
  private refreshSub?: any;

  ngOnInit(): void {
    this.loadAnalysts(false);
    this.startLiveSync();
  }

  ngOnDestroy(): void {
    this.stopLiveSync();
  }

  startLiveSync(): void {
    this.stopLiveSync();
    if (!this.isLiveSyncEnabled) return;
    this.refreshSub = setInterval(() => {
      this.loadAnalysts(true);
    }, 10000);
  }

  stopLiveSync(): void {
    if (this.refreshSub) {
      clearInterval(this.refreshSub);
      this.refreshSub = undefined;
    }
  }

  toggleLiveSync(): void {
    this.isLiveSyncEnabled = !this.isLiveSyncEnabled;
    if (this.isLiveSyncEnabled) {
      this.startLiveSync();
      this.loadAnalysts(true);
    } else {
      this.stopLiveSync();
    }
  }

  loadAnalysts(isBackground = false): void {
    if (!isBackground) {
      this.isLoading = true;
    } else {
      this.isBackgroundSyncing = true;
    }
    
    this.apiService.get<AnalystPerformance[]>('/manager/analysts').subscribe({
      next: (performances) => {
        this.performances = performances;
        this.lastSyncTime = new Date();
        this.isLoading = false;
        this.isBackgroundSyncing = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load analysts.';
        this.isLoading = false;
        this.isBackgroundSyncing = false;
      }
    });
  }

  fireAnalyst(id: number): void {
    if (confirm('Are you sure you want to mark this employee as fired?')) {
      this.apiService.put(`/users/${id}/fire`, {}).subscribe({
        next: () => {
          this.loadAnalysts();
        },
        error: (err) => {
          this.errorMessage = 'Failed to fire employee.';
        }
      });
    }
  }
}
