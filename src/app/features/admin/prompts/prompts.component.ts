import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface PromptConfig {
  modelId: number;
  stageName: string;
  modelName: string;
  contextWindowSize: number;
  temperature: number;
  keepAliveSetting: string;
  active: boolean;
  promptId: number | null;
  promptText: string;
  versionTag: string;
  updatedAt: string | null;
}

@Component({
  selector: 'app-prompts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompts.component.html',
  styleUrl: './prompts.component.scss'
})
export class PromptsComponent implements OnInit {
  private apiService = inject(ApiService);

  configs: PromptConfig[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  activeStage: string = 'solvency';
  stages: string[] = ['solvency', 'history', 'guarantees', 'compliance', 'supervisor'];

  ngOnInit(): void {
    this.fetchConfigs();
  }

  fetchConfigs(): void {
    this.isLoading = true;
    this.apiService.get<PromptConfig[]>('/prompts').subscribe({
      next: (data) => {
        this.configs = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load prompt configurations.';
        this.isLoading = false;
      }
    });
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

    this.apiService.put<any>(`/prompts/${config.modelId}`, payload).subscribe({
      next: (res) => {
        this.successMessage = `Successfully updated ${config.stageName.toUpperCase()} configurations.`;
        this.fetchConfigs();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save prompt configuration.';
        this.isLoading = false;
      }
    });
  }
}
