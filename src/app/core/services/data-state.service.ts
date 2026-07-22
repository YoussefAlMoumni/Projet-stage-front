import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Dossier, AnalystPerformance, User, PromptConfig } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class DataStateService implements OnDestroy {
  // Central state holding the latest arrays
  private dossiersSubject = new BehaviorSubject<Dossier[]>([]);
  public dossiers$ = this.dossiersSubject.asObservable();

  private analystsSubject = new BehaviorSubject<AnalystPerformance[]>([]);
  public analysts$ = this.analystsSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private promptsSubject = new BehaviorSubject<PromptConfig[]>([]);
  public prompts$ = this.promptsSubject.asObservable();

  // Polling State
  private refreshSub?: any;
  
  public lastDossierSyncTime: Date = new Date();
  public lastAnalystSyncTime: Date = new Date();
  public lastUserSyncTime: Date = new Date();
  public lastPromptSyncTime: Date = new Date();
  
  // Expose syncing indicators to components
  public isDossiersSyncing = new BehaviorSubject<boolean>(false);
  public isAnalystsSyncing = new BehaviorSubject<boolean>(false);
  public isUsersSyncing = new BehaviorSubject<boolean>(false);
  public isPromptsSyncing = new BehaviorSubject<boolean>(false);

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

  public fetchUsers(isBackground = false): void {
    if (isBackground) this.isUsersSyncing.next(true);

    this.apiService.get<User[]>('/users').subscribe({
      next: (data) => {
        this.usersSubject.next(data);
        this.lastUserSyncTime = new Date();
        this.isUsersSyncing.next(false);
      },
      error: () => {
        this.isUsersSyncing.next(false);
      }
    });
  }

  public fetchPrompts(isBackground = false): void {
    if (isBackground) this.isPromptsSyncing.next(true);

    this.apiService.get<PromptConfig[]>('/prompts').subscribe({
      next: (data) => {
        this.promptsSubject.next(data);
        this.lastPromptSyncTime = new Date();
        this.isPromptsSyncing.next(false);
      },
      error: () => {
        this.isPromptsSyncing.next(false);
      }
    });
  }

  // Polling Management
  public startLiveSync(): void {
    this.stopLiveSync();

    this.refreshSub = setInterval(() => {
      this.fetchDossiers(true);
      this.fetchAnalysts(true);
      this.fetchUsers(true);
      this.fetchPrompts(true);
    }, 10000);
  }

  public stopLiveSync(): void {
    if (this.refreshSub) {
      clearInterval(this.refreshSub);
      this.refreshSub = undefined;
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

  public addUserOptimistically(user: User): void {
    const current = this.usersSubject.value;
    this.usersSubject.next([...current, user]);
  }

  public updateUserOptimistically(user: User): void {
    const current = this.usersSubject.value;
    this.usersSubject.next(current.map(u => u.id === user.id ? user : u));
  }

  public removeUserOptimistically(userId: number): void {
    const current = this.usersSubject.value;
    this.usersSubject.next(current.filter(u => u.id !== userId));
  }

  public updatePromptOptimistically(config: PromptConfig): void {
    const current = this.promptsSubject.value;
    this.promptsSubject.next(current.map(c => c.modelId === config.modelId ? config : c));
  }
}
