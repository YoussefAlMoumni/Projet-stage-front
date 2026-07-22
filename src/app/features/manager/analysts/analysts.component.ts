import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DataStateService } from '../../../core/services/data-state.service';
import { AnalystPerformance } from '../../../core/models/types';

@Component({
  selector: 'app-analysts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysts.component.html',
  styleUrl: './analysts.component.scss'
})
export class AnalystsComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);
  private apiService = inject(ApiService);

  performances: AnalystPerformance[] = [];
  isLoading = false;
  errorMessage = '';
  
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.dataState.analysts$.subscribe(data => {
      this.performances = data;
    });

    if (this.performances.length === 0) {
      this.dataState.fetchAnalysts(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  fireAnalyst(id: number): void {
    if (confirm('Are you sure you want to mark this employee as fired?')) {
      // Optimistic update
      this.dataState.markAnalystFiredOptimistically(id);
      
      this.apiService.put(`/users/${id}/fire`, {}).subscribe({
        next: () => {
          this.dataState.fetchAnalysts(true); // Sync real state
        },
        error: (err) => {
          this.errorMessage = 'Failed to fire employee.';
          this.dataState.fetchAnalysts(true); // Revert on failure
        }
      });
    }
  }
}
