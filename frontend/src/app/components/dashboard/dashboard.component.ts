import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { StudentDashboardComponent } from './student-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminDashboardComponent, StudentDashboardComponent],
  template: `
    <nav class="navbar navbar-expand-lg glass-card sticky-top py-3 border-0 border-bottom">
      <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="#">
          <span class="bg-primary text-white p-2 rounded-3 me-2 fs-5">📊</span>
          <span class="ls-1">PROGRESS REPORT</span>
        </a>
        
        <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarContent">
          <div class="ms-auto d-flex align-items-center pt-3 pt-lg-0">
            <div class="me-4 d-none d-md-block text-end">
              <span class="d-block small text-muted text-uppercase fw-semibold ls-1">Connected as</span>
              <span class="fw-bold text-dark">{{ (currentUser$ | async)?.name }}</span>
            </div>
            <button (click)="onLogout()" class="btn btn-outline-danger px-4 rounded-pill fw-bold small">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="container py-4 mb-5">
      <div [ngSwitch]="role">
        <div class="animate-fade-in" *ngSwitchCase="'admin'">
          <app-admin-dashboard></app-admin-dashboard>
        </div>
        <div class="animate-fade-in" *ngSwitchCase="'student'">
          <app-student-dashboard></app-student-dashboard>
        </div>
        <div *ngSwitchDefault class="text-center mt-5 py-5 glass-card rounded-4">
          <p class="text-muted">Session expired. Please log in again.</p>
          <a routerLink="/login" class="btn btn-primary rounded-pill px-4">Go to Login</a>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .navbar-brand { font-size: 1.25rem; }
    .ls-1 { letter-spacing: 1px; }
  `]
})
export class DashboardComponent {
  currentUser$ = this.auth.currentUser$;
  role: string | null = null;

  constructor(private auth: AuthService, private router: Router) {
    this.role = this.auth.getRole();
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
