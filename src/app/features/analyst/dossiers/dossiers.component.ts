import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DataStateService } from '../../../core/services/data-state.service';
import { Dossier, Loan, Collateral } from '../../../core/models/types';
interface StageResult {
  stageName: string;
  output: string;
  summary?: string;
  durationMs: number;
}

interface EvaluationResult {
  evaluation: {
    id: number;
    executionMode: string;
    solvencyStageOutput: string;
    solvencyDurationMs: number;
    historyStageOutput: string;
    historyDurationMs: number;
    guaranteesStageOutput: string;
    guaranteesDurationMs: number;
    complianceStageOutput: string;
    complianceDurationMs: number;
    supervisorStageOutput: string;
    supervisorDurationMs: number;
    createdAt: string;
  };
  stageResults: StageResult[];
}

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossiers.component.html',
  styleUrl: './dossiers.component.scss'
})
export class DossiersComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  dossiers: Dossier[] = [];
  selectedDossier: Dossier | null = null;
  
  viewMode: 'list' | 'create' | 'detail' | 'edit' = 'list';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private sub?: Subscription;
  private pollInterval: any;
  private messageTimeout?: any;

  // Form step
  formStep = 1;

  // New Dossier Form Model
  newDossier: Dossier = this.getEmptyDossier();

  // Smart Evaluation Variables
  evalMode: 'FAST' | 'FULL' = 'FAST';
  isEvaluating = false;
  evaluationProgress = 0; // 0 to 100
  evaluationLog: string[] = [];
  latestEvaluation: EvaluationResult | null = null;
  activeDetailTab: 'overview' | 'loans' | 'collaterals' | 'decision' = 'overview';
  stageExpandedStates: Record<string, boolean> = {};

  ngOnInit(): void {
    this.sub = this.dataState.dossiers$.subscribe(data => {
      this.dossiers = data;
    });

    if (this.dossiers.length === 0) {
      this.dataState.fetchDossiers(true);
    }

    // Auto-refresh evaluation dynamically without manual clicks
    this.pollInterval = setInterval(() => {
      if (this.viewMode === 'detail' && this.selectedDossier && !this.isEvaluating && this.activeDetailTab === 'decision') {
        this.fetchLatestEvaluation(this.selectedDossier.id!);
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
  }

  showMessage(type: 'success' | 'error', msg: string) {
    if (type === 'success') {
      this.successMessage = msg;
      this.errorMessage = '';
    } else {
      this.errorMessage = msg;
      this.successMessage = '';
    }
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  getEmptyDossier(): Dossier {
    return {
      siren: '',
      clientType: 'corporate',
      status: 'in_progress',
      loans: [{
        amount: 50000,
        interestRate: 2.5,
        termMonths: 24,
        paymentFrequency: 'monthly',
        status: 'active',
        collaterals: [{
          type: 'real_estate',
          description: '',
          estimatedValue: 75000,
          valuationDate: new Date().toISOString().substring(0, 10),
          status: 'active'
        }]
      }]
    };
  }

  openCreateForm(): void {
    this.viewMode = 'create';
    this.formStep = 1;
    this.newDossier = this.getEmptyDossier();
  }

  openEditForm(dossier: Dossier): void {
    this.viewMode = 'edit';
    this.formStep = 1;
    // Deep clone the dossier to avoid mutating state before saving
    this.newDossier = JSON.parse(JSON.stringify(dossier));
    // Ensure lists exist
    if (!this.newDossier.loans) this.newDossier.loans = [];
    this.newDossier.loans.forEach(loan => {
      if (!loan.collaterals) loan.collaterals = [];
    });
  }

  addLoan(): void {
    if (!this.newDossier.loans) this.newDossier.loans = [];
    this.newDossier.loans.push({
      amount: 0,
      interestRate: 0,
      termMonths: 12,
      paymentFrequency: 'monthly',
      status: 'active',
      collaterals: []
    });
  }

  removeLoan(index: number): void {
    this.newDossier.loans?.splice(index, 1);
  }

  addCollateral(loanIndex: number): void {
    const loan = this.newDossier.loans![loanIndex];
    if (!loan.collaterals) loan.collaterals = [];
    loan.collaterals.push({
      type: 'real_estate',
      description: '',
      estimatedValue: 0,
      valuationDate: new Date().toISOString().substring(0, 10),
      status: 'active'
    });
  }

  removeCollateral(loanIndex: number, colIndex: number): void {
    this.newDossier.loans![loanIndex].collaterals?.splice(colIndex, 1);
  }

  viewDossierDetails(dossier: Dossier): void {
    this.selectedDossier = dossier;
    this.viewMode = 'detail';
    this.activeDetailTab = 'overview';
    this.latestEvaluation = null;
    this.fetchLatestEvaluation(dossier.id!);
  }

  fetchLatestEvaluation(dossierId: number): void {
    this.apiService.get<any>(`/dossiers/${dossierId}/ai-decision`).subscribe({
      next: (res) => {
        if (res && res.evaluation) {
          this.latestEvaluation = res;
        }
      },
      error: () => {
        // No evaluation exists yet
        this.latestEvaluation = null;
      }
    });
  }

  nextStep(): void {
    if (this.formStep === 1 && !this.newDossier.siren) {
      alert('SIREN is required.');
      return;
    }
    this.formStep++;
  }

  prevStep(): void {
    this.formStep--;
  }

  saveDossier(): void {
    this.isLoading = true;
    
    if (this.viewMode === 'create') {
      const tempDossier = { ...this.newDossier, id: Date.now() }; // Fake ID
      this.dataState.addDossierOptimistically(tempDossier);
      this.viewMode = 'list';
      
      this.apiService.post<Dossier>('/dossiers', this.newDossier).subscribe({
        next: () => {
          this.showMessage('success', 'Dossier created successfully.');
          this.dataState.fetchDossiers(true); // Sync
          this.isLoading = false;
        },
        error: (err) => {
          this.showMessage('error', err.error?.message || 'Failed to create dossier.');
          this.dataState.fetchDossiers(true); // Revert
          this.isLoading = false;
        }
      });
    } else if (this.viewMode === 'edit') {
      this.viewMode = 'list';
      this.apiService.put<Dossier>(`/dossiers/${this.newDossier.id}`, this.newDossier).subscribe({
        next: () => {
          this.showMessage('success', 'Dossier updated successfully.');
          this.dataState.fetchDossiers(true); // Sync
          this.isLoading = false;
        },
        error: (err) => {
          this.showMessage('error', err.error?.message || 'Failed to update dossier.');
          this.dataState.fetchDossiers(true); // Revert
          this.isLoading = false;
        }
      });
    }
  }

  deleteDossier(id: number): void {
    if (!confirm('Are you sure you want to delete this dossier? All related loans and collaterals will be deleted.')) {
      return;
    }
    
    // Optimistic Update
    this.dataState.removeDossierOptimistically(id);
    if (this.selectedDossier?.id === id) {
      this.viewMode = 'list';
    }

    this.apiService.delete<any>(`/dossiers/${id}`).subscribe({
      next: () => {
        this.showMessage('success', 'Dossier deleted successfully.');
        this.dataState.fetchDossiers(true); // Sync
      },
      error: () => {
        this.showMessage('error', 'Failed to delete dossier.');
        this.dataState.fetchDossiers(true); // Revert on failure
      }
    });
  }

  async triggerSmartDecision(): Promise<void> {
    if (!this.selectedDossier) return;
    this.isEvaluating = true;
    this.evaluationProgress = 10;
    this.evaluationLog = ['Initializing pipeline orchestrator...', `Execution mode: ${this.evalMode}`];
    this.activeDetailTab = 'decision';
    this.stageExpandedStates = {};
    
    // Initialize empty evaluation object to store live dynamic results
    this.latestEvaluation = {
      evaluation: {
        id: 0, executionMode: this.evalMode, createdAt: new Date().toISOString(),
        solvencyStageOutput: '', solvencyDurationMs: 0,
        historyStageOutput: '', historyDurationMs: 0,
        guaranteesStageOutput: '', guaranteesDurationMs: 0,
        complianceStageOutput: '', complianceDurationMs: 0,
        supervisorStageOutput: '', supervisorDurationMs: 0
      },
      stageResults: []
    };
    
    const token = localStorage.getItem('auth_token');
    const url = `/api/dossiers/${this.selectedDossier.id}/ai-decision/stream?mode=${this.evalMode}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        }
      });
      
      if (!response.body) throw new Error('No readable stream available.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (!dataStr) continue;
            const event = JSON.parse(dataStr);

             if (event.evaluation) {
               // Full EvaluationResultDto on complete
               this.evaluationProgress = 100;
               this.evaluationLog.push('Pipeline evaluation completed successfully!');
               this.latestEvaluation = event;
               this.isEvaluating = false;
               this.cdr.detectChanges();
            } else {
               // PipelineStageEvent
               if (event.status === 'STARTED') {
                 this.evaluationLog.push(`Running ${event.stageName} Agent Stage...`);
                 this.evaluationProgress = event.progress;
                 this.cdr.detectChanges();
               } else if (event.status === 'COMPLETED') {
                 this.evaluationLog.push(`Completed ${event.stageName} in ${event.durationMs}ms`);
                 if (event.summary) {
                   this.evaluationLog.push(`  • ${event.summary}`);
                 } else if (event.output) {
                   const briefMsg = event.output.split('\n').filter((l: string) => l.trim().length > 0)[0];
                   this.evaluationLog.push(`  > ${briefMsg}`);
                 }
                 this.evaluationProgress = event.progress;
                 const existingIdx = this.latestEvaluation!.stageResults.findIndex(s => s.stageName === event.stageName);
                 const stageResult = {
                    stageName: event.stageName,
                    output: event.output,
                    summary: event.summary ?? undefined,
                    durationMs: event.durationMs
                 };
                 if (existingIdx >= 0) {
                    this.latestEvaluation!.stageResults[existingIdx] = stageResult;
                 } else {
                    this.latestEvaluation!.stageResults.push(stageResult);
                 }
                 this.cdr.detectChanges();
               }
            }
          }
        }
      }
    } catch (err: any) {
      this.evaluationLog.push('Pipeline failure encountered.');
      this.showMessage('error', err.message || 'AI pipeline execution failed.');
      this.isEvaluating = false;
      this.cdr.detectChanges();
    }
  }

  updateDecisionStatus(status: string): void {
    if (!this.selectedDossier) return;
    this.isLoading = true;
    this.apiService.put<Dossier>(`/dossiers/${this.selectedDossier.id}/status`, { status }).subscribe({
      next: (updated) => {
        // Update the detail view header immediately
        this.selectedDossier!.status = updated.status;
        // Also update the row in the list so the badge reflects the new status without a full refetch
        const idx = this.dossiers.findIndex(d => d.id === updated.id);
        if (idx !== -1) {
          this.dossiers[idx] = { ...this.dossiers[idx], status: updated.status };
        }
        this.showMessage('success', `Dossier status updated to ${status}.`);
        this.dataState.fetchDossiers(true);
        this.isLoading = false;
      },
      error: (err) => {
        this.showMessage('error', err.error?.message || 'Failed to update dossier status.');
        this.isLoading = false;
      }
    });
  }

  // Simple Markdown Parser to render reports nicely in HTML
  toggleStageDetails(stageName: string): void {
    this.stageExpandedStates[stageName] = !this.stageExpandedStates[stageName];
  }

  parseMarkdown(text: string | undefined): string {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header conversions
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Code blocks / Code tags
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

    // Unordered lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    
    // Replace newlines with breaks outside header tag wrappers
    html = html.replace(/\n/gim, '<br/>');
    
    return html;
  }
}
