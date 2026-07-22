import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DataStateService } from '../../../core/services/data-state.service';
import { PromptConfig } from '../../../core/models/types';

@Component({
  selector: 'app-prompts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompts.component.html',
  styleUrl: './prompts.component.scss'
})
export class PromptsComponent implements OnInit, OnDestroy {
  public dataState = inject(DataStateService);
  private apiService = inject(ApiService);

  configs: PromptConfig[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  private sub?: Subscription;

  activeStage: string = 'solvency';
  stages: string[] = ['solvency', 'history', 'guarantees', 'compliance', 'supervisor'];

  ngOnInit(): void {
    this.sub = this.dataState.prompts$.subscribe(data => {
      this.configs = data;
    });

    if (this.configs.length === 0) {
      this.dataState.fetchPrompts(true);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  getConfigForStage(stage: string): PromptConfig | undefined {
    return this.configs.find(c => c.stageName === stage);
  }

  saveConfig(config: PromptConfig): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      modelName: config.modelName,
      contextWindowSize: config.contextWindowSize,
      temperature: config.temperature,
      keepAliveSetting: config.keepAliveSetting,
      promptText: config.promptText
    };

    // Optimistic UI update
    this.dataState.updatePromptOptimistically(config);
    this.successMessage = `Saving ${config.stageName.toUpperCase()} configurations...`;

    this.apiService.put<any>(`/prompts/${config.modelId}`, payload).subscribe({
      next: (res) => {
        this.successMessage = `Successfully updated ${config.stageName.toUpperCase()} configurations.`;
        this.dataState.fetchPrompts(true); // Sync real state
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save prompt configuration.';
        this.dataState.fetchPrompts(true); // Revert
        this.isLoading = false;
      }
    });
  }
}
