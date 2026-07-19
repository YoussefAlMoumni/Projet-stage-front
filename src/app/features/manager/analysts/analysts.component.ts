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
  dossierCount?: number;
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

  analysts: Analyst[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadAnalysts();
  }

  loadAnalysts(): void {
    this.isLoading = true;
    this.apiService.get<Analyst[]>('/users').subscribe({
      next: (users) => {
        // Filter to analyst & manager roles; count assigned dossiers
        const filteredUsers = users.filter(u => u.role === 'analyst' || u.role === 'manager');
        // Also fetch dossiers to count assignments
        this.apiService.get<any[]>('/dossiers').subscribe({
          next: (dossiers) => {
            this.analysts = filteredUsers.map(u => ({
              ...u,
              dossierCount: dossiers.filter(d => d.assignedAnalyst?.username === u.username).length
            }));
            this.isLoading = false;
          },
          error: () => {
            this.analysts = filteredUsers;
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load analysts.';
        this.isLoading = false;
      }
    });
  }
}
