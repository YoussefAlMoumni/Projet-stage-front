export interface Collateral {
  id?: number;
  type: string;
  description: string;
  estimatedValue: number;
  valuationDate: string;
  status: string;
}

export interface Loan {
  id?: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: string;
  status: string;
  collaterals: Collateral[];
}

export interface Dossier {
  id?: number;
  siren: string;
  clientType: string;
  status: string;
  creationDate?: string;
  assignedAnalyst?: { id: number; username: string; firstName: string; lastName: string; role: string; };
  loans: Loan[];
  name?: string;
  montantDemande?: string;
}

export interface Analyst {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  fired: boolean;
}

export interface AnalystPerformance {
  analyst: Analyst;
  totalDossiers: number;
  completedDossiers: number;
  performanceScore: number;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
  gender: string;
  role: string;
  salary: number;
  hireDate?: string;
  fired: boolean;
}

export interface PromptConfig {
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
