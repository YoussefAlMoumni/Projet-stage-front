import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Dossier, AnalystPerformance } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class DataStateService implements OnDestroy {
  // Central state holding the latest arrays
  private dossiersSubject = new BehaviorSubject<Dossier[]>([]);
  public dossiers$ = this.dossiersSubject.asObservable();

  private analystsSubject = new BehaviorSubject<AnalystPerformance[]>([]);
  public analysts$ = this.analystsSubject.asObservable();

  // Polling State
  private refreshSub?: any;
  public isLiveSyncEnabled = true;
  
  public lastDossierSyncTime: Date = new Date();
  public lastAnalystSyncTime: Date = new Date();
  
  // Expose syncing indicators to components
  public isDossiersSyncing = new BehaviorSubject<boolean>(false);
  public isAnalystsSyncing = new BehaviorSubject<boolean>(false);

  constructor(private apiService: ApiService) {}

  ngOnDestroy(): void {
    this.stopLiveSync();
  }

  // Initial Fetch Operations
  public fetchDossiers(isBackground = false): void {
    if (isBackground) this.isDossiersSyncing.next(true);
    
    this.apiService.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => {
        this.dossiersSubject.next(data);
        this.lastDossierSyncTime = new Date();
        this.isDossiersSyncing.next(false);
      },
      error: () => {
        this.isDossiersSyncing.next(false);
      }
    });
  }

  public fetchAnalysts(isBackground = false): void {
    if (isBackground) this.isAnalystsSyncing.next(true);

    this.apiService.get<AnalystPerformance[]>('/manager/analysts').subscribe({
      next: (data) => {
        this.analystsSubject.next(data);
        this.lastAnalystSyncTime = new Date();
        this.isAnalystsSyncing.next(false);
      },
      error: () => {
        this.isAnalystsSyncing.next(false);
      }
    });
  }

  // Polling Management
  public startLiveSync(): void {
    this.stopLiveSync();
    if (!this.isLiveSyncEnabled) return;

    this.refreshSub = setInterval(() => {
      this.fetchDossiers(true);
      this.fetchAnalysts(true);
    }, 10000);
  }

  public stopLiveSync(): void {
    if (this.refreshSub) {
      clearInterval(this.refreshSub);
      this.refreshSub = undefined;
    }
  }

  public toggleLiveSync(): void {
    this.isLiveSyncEnabled = !this.isLiveSyncEnabled;
    if (this.isLiveSyncEnabled) {
      this.startLiveSync();
      this.fetchDossiers(true);
      this.fetchAnalysts(true);
    } else {
      this.stopLiveSync();
    }
  }

  // Optimistic UI Updaters
  public addDossierOptimistically(dossier: Dossier): void {
    const current = this.dossiersSubject.value;
    this.dossiersSubject.next([...current, dossier]);
  }

  public removeDossierOptimistically(dossierId: number): void {
    const current = this.dossiersSubject.value;
    this.dossiersSubject.next(current.filter(d => d.id !== dossierId));
  }

  public markAnalystFiredOptimistically(analystId: number): void {
    const current = this.analystsSubject.value;
    const updated = current.map(perf => {
      if (perf.analyst.id === analystId) {
        return { ...perf, analyst: { ...perf.analyst, fired: true } };
      }
      return perf;
    });
    this.analystsSubject.next(updated);
  }
}
