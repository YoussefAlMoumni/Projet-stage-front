import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.getUser();
  userRole = this.authService.getRole();

  navItems: NavItem[] = [
    {
      label: 'Employees',
      icon: 'users',
      path: '/employees',
      roles: ['admin']
    },
    {
      label: 'Prompts',
      icon: 'message-square',
      path: '/prompts',
      roles: ['admin']
    },
    {
      label: 'Dossiers',
      icon: 'folder',
      path: '/dossiers',
      roles: ['analyst', 'manager']
    },
    {
      label: 'Loans',
      icon: 'dollar-sign',
      path: '/loans',
      roles: ['analyst']
    },
    {
      label: 'Collaterals',
      icon: 'shield',
      path: '/collaterals',
      roles: ['analyst']
    },
    {
      label: 'Analysts',
      icon: 'user-check',
      path: '/analysts',
      roles: ['manager']
    }
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => 
      this.authService.hasAnyRole(item.roles)
    );
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
