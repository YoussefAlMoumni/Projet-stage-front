import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DataStateService } from '../../../core/services/data-state.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss'
})
export class AuthenticatedLayoutComponent implements OnInit, OnDestroy {
  private dataState = inject(DataStateService);

  ngOnInit(): void {
    // Start dynamic refreshing for all authenticated pages
    this.dataState.startLiveSync();
  }

  ngOnDestroy(): void {
    this.dataState.stopLiveSync();
  }
}
