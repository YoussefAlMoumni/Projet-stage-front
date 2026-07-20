import { Component, OnInit, inject } from '@angular/core';
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
export class AnalystsComponent implements OnInit {
  private apiService = inject(ApiService);

  performances: AnalystPerformance[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadAnalysts();
  }

  loadAnalysts(): void {
    this.isLoading = true;
    this.apiService.get<AnalystPerformance[]>('/manager/analysts').subscribe({
      next: (performances) => {
        this.performances = performances;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load analysts.';
        this.isLoading = false;
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
