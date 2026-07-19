import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Collateral {
  id?: number;
  type: string;
  description: string;
  estimatedValue: number;
  valuationDate: string;
  status: string;
}

interface Loan {
  id?: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: string;
  status: string;
  collaterals: Collateral[];
}

interface Dossier {
  id?: number;
  siren: string;
  clientType: string;
  status: string;
  creationDate?: string;
  assignedAnalyst?: any;
  loans: Loan[];
  name?: string;
  montantDemande?: string;
}

interface StageResult {
  stageName: string;
  output: string;
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
export class DossiersComponent implements OnInit {
  private apiService = inject(ApiService);

  dossiers: Dossier[] = [];
  selectedDossier: Dossier | null = null;
  
  viewMode: 'list' | 'create' | 'detail' = 'list';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

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

  ngOnInit(): void {
    this.fetchDossiers();
  }

  fetchDossiers(): void {
    this.isLoading = true;
    this.apiService.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => {
        this.dossiers = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load dossiers.';
        this.isLoading = false;
      }
    });
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
    this.apiService.post<Dossier>('/dossiers', this.newDossier).subscribe({
      next: () => {
        this.successMessage = 'Dossier created successfully.';
        this.fetchDossiers();
        this.viewMode = 'list';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create dossier.';
        this.isLoading = false;
      }
    });
  }

  deleteDossier(id: number): void {
    if (!confirm('Are you sure you want to delete this dossier? All related loans and collaterals will be deleted.')) {
      return;
    }
    this.isLoading = true;
    this.apiService.delete<any>(`/dossiers/${id}`).subscribe({
      next: () => {
        this.successMessage = 'Dossier deleted successfully.';
        this.fetchDossiers();
        if (this.selectedDossier?.id === id) {
          this.viewMode = 'list';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to delete dossier.';
        this.isLoading = false;
      }
    });
  }

  triggerSmartDecision(): void {
    if (!this.selectedDossier) return;
    this.isEvaluating = true;
    this.evaluationProgress = 10;
    this.evaluationLog = ['Initializing pipeline orchestrator...', `Execution mode: ${this.evalMode}`];
    this.activeDetailTab = 'decision';
    
    // Simulate pipeline workflow visualizer updates step by step
    setTimeout(() => {
      this.evaluationProgress = 25;
      this.evaluationLog.push('Running Solvency Agent Stage: calculating debt ratios...');
    }, 1500);

    setTimeout(() => {
      this.evaluationProgress = 45;
      this.evaluationLog.push('Running History Agent Stage: searching historical database & payment incidents...');
    }, 3000);

    setTimeout(() => {
      this.evaluationProgress = 65;
      this.evaluationLog.push('Running Guarantees Agent Stage: valuing collateral assets...');
    }, 4500);

    setTimeout(() => {
      this.evaluationProgress = 85;
      this.evaluationLog.push('Running Compliance Agent Stage: performing KYC/AML regulations audit...');
    }, 6000);

    // Call real backend API decision logic
    this.apiService.post<EvaluationResult>(`/dossiers/${this.selectedDossier.id}/ai-decision?mode=${this.evalMode}`, {}).subscribe({
      next: (res) => {
        this.evaluationProgress = 100;
        this.evaluationLog.push('Running Supervisor Agent Stage: consolidating report...');
        this.evaluationLog.push('Pipeline evaluation completed successfully!');
        this.latestEvaluation = res;
        this.isEvaluating = false;
      },
      error: (err) => {
        this.evaluationLog.push('Pipeline failure encountered.');
        this.errorMessage = err.error?.message || 'AI pipeline execution failed.';
        this.isEvaluating = false;
      }
    });
  }

  // Simple Markdown Parser to render reports nicely in HTML
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
