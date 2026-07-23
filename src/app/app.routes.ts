import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { RecoveryMethodsComponent } from './features/auth/recovery-methods/recovery-methods.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthenticatedLayoutComponent } from './shared/layouts/authenticated-layout/authenticated-layout.component';
import { EmployeesComponent } from './features/admin/employees/employees.component';
import { PromptsComponent } from './features/admin/prompts/prompts.component';
import { DossiersComponent } from './features/analyst/dossiers/dossiers.component';
import { LoansComponent } from './features/analyst/loans/loans.component';
import { CollateralsComponent } from './features/analyst/collaterals/collaterals.component';
import { AnalystsComponent } from './features/manager/analysts/analysts.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'forgot-password/recovery',
    component: RecoveryMethodsComponent
  },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [roleGuard(['admin'])]
      },
      {
        path: 'prompts',
        component: PromptsComponent,
        canActivate: [roleGuard(['admin'])]
      },
      {
        path: 'dossiers',
        component: DossiersComponent,
        canActivate: [roleGuard(['analyst', 'manager'])]
      },
      {
        path: 'loans',
        component: LoansComponent,
        canActivate: [roleGuard(['analyst'])]
      },
      {
        path: 'collaterals',
        component: CollateralsComponent,
        canActivate: [roleGuard(['analyst'])]
      },
      {
        path: 'analysts',
        component: AnalystsComponent,
        canActivate: [roleGuard(['manager'])]
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
