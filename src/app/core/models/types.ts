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
  assignedAnalyst?: any;
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
