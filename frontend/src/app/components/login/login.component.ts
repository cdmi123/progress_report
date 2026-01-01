import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper d-flex align-items-center justify-content-center">
      <div class="container px-4">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5 col-xl-4">
            <div class="card glass-card border-0 p-4 animate-fade-in" style="border-radius: 2rem;">
              <div class="card-body">
                <div class="text-center mb-4">
                  <div class="brand-logo mb-3">
                    <span class="fs-1">📊</span>
                  </div>
                  <h2 class="fw-bold text-dark mb-1">Welcome Back</h2>
                  <p class="text-muted small">Sign in to manage your progress</p>
                </div>

                <div class="role-selector mb-4">
                  <div class="btn-group w-100 p-1 bg-light rounded-pill shadow-sm" role="group">
                    <input type="radio" class="btn-check" name="role" id="adminRole" [(ngModel)]="role" value="admin">
                    <label class="btn btn-role rounded-pill border-0 py-2 small" for="adminRole">Admin</label>
                    
                    <input type="radio" class="btn-check" name="role" id="studentRole" [(ngModel)]="role" value="student">
                    <label class="btn btn-role rounded-pill border-0 py-2 small" for="studentRole">Student</label>
                  </div>
                </div>
                
                <form (ngSubmit)="onSubmit()">
                  <div class="mb-3" *ngIf="role === 'admin'">
                    <label class="form-label fw-semibold small text-uppercase ls-1">Email Address</label>
                    <input type="email" class="form-control border-0 bg-light py-3" [(ngModel)]="credentials.email" name="email" placeholder="name@example.com" required>
                  </div>
                  <div class="mb-3" *ngIf="role === 'student'">
                    <label class="form-label fw-semibold small text-uppercase ls-1">Contact Number</label>
                    <input type="text" class="form-control border-0 bg-light py-3" [(ngModel)]="credentials.contact" name="contact" placeholder="Enter contact number" required>
                  </div>
                  <div class="mb-4">
                    <label class="form-label fw-semibold small text-uppercase ls-1">Password</label>
                    <input type="password" class="form-control border-0 bg-light py-3" [(ngModel)]="credentials.password" name="password" placeholder="••••••••" required>
                  </div>
                  <div class="alert alert-danger px-3 py-2 small rounded-3 border-0 shadow-sm mb-4" *ngIf="error">
                     {{ error }}
                  </div>
                  <button type="submit" class="btn btn-primary w-100 py-3 shadow-lg border-0 fw-bold rounded-4" [disabled]="loading">
                    <span *ngIf="!loading">Login to Account</span>
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <span *ngIf="loading">Processing...</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-wrapper::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('/login-bg.png') no-repeat center center;
      background-size: cover;
      filter: blur(8px); /* Approx 30% blur of a standard high-blur range */
      transform: scale(1.1); /* Prevent white edges from blur */
      z-index: 0;
    }
    .container {
      position: relative;
      z-index: 1;
    }
    .btn-check:checked + .btn-role {
      background-color: #ffffff !important;
      color: #4361ee !important;
      font-weight: 600;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .btn-role {
      flex: 1;
      color: #6c757d;
      transition: all 0.3s ease;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }
    .brand-logo {
      height: 70px;
      width: 70px;
      background: white;
      border-radius: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      font-size: 2rem;
    }
    .ls-1 { letter-spacing: 1px; }
  `]
})
export class LoginComponent {
  role: 'admin' | 'student' = 'admin';
  credentials: any = { email: '', contact: '', password: '' };
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    this.loading = true;
    this.error = '';
    const loginData = this.role === 'admin'
      ? { email: this.credentials.email, password: this.credentials.password }
      : { contact: this.credentials.contact, password: this.credentials.password };

    this.auth.login(loginData, this.role).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.message || 'Login failed';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Connection error';
        this.loading = false;
      }
    });
  }
}
