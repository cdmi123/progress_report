import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-section mb-5">
      <h2 class="fw-bold text-dark">Administrative Overview</h2>
      <p class="text-muted">Monitor student performance and manage educational resources.</p>
    </div>

    <div class="row g-4">
      <div class="col-sm-6 col-xl-3">
        <div class="card modern-card overflow-hidden">
          <div class="card-body p-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape bg-primary-subtle text-primary rounded-3 me-3">
                <span class="fs-4">👥</span>
              </div>
              <h6 class="text-muted small text-uppercase fw-bold mb-0 ls-1">Students</h6>
            </div>
            <h2 class="display-6 fw-bold mb-0">{{ stats?.totalStudents || 0 }}</h2>
            <div class="progress mt-3 rounded-pill" style="height: 4px;">
              <div class="progress-bar bg-primary" style="width: 70%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-sm-6 col-xl-3">
        <div class="card modern-card overflow-hidden">
          <div class="card-body p-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape bg-success-subtle text-success rounded-3 me-3">
                <span class="fs-4">📚</span>
              </div>
              <h6 class="text-muted small text-uppercase fw-bold mb-0 ls-1">Courses</h6>
            </div>
            <h2 class="display-6 fw-bold mb-0">{{ stats?.totalCourses || 0 }}</h2>
            <div class="progress mt-3 rounded-pill" style="height: 4px;">
              <div class="progress-bar bg-success" style="width: 45%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-xl-3">
        <div class="card modern-card overflow-hidden">
          <div class="card-body p-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape bg-info-subtle text-info rounded-3 me-3">
                <span class="fs-4">📄</span>
              </div>
              <h6 class="text-muted small text-uppercase fw-bold mb-0 ls-1">Reports</h6>
            </div>
            <h2 class="display-6 fw-bold mb-0">{{ stats?.totalReports || 0 }}</h2>
            <div class="progress mt-3 rounded-pill" style="height: 4px;">
              <div class="progress-bar bg-info" style="width: 60%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-xl-3">
        <div class="card modern-card overflow-hidden">
          <div class="card-body p-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape bg-warning-subtle text-warning rounded-3 me-3">
                <span class="fs-4">🛡️</span>
              </div>
              <h6 class="text-muted small text-uppercase fw-bold mb-0 ls-1">Faculty</h6>
            </div>
            <h2 class="display-6 fw-bold mb-0">{{ stats?.totalAdmins || 0 }}</h2>
            <div class="progress mt-3 rounded-pill" style="height: 4px;">
              <div class="progress-bar bg-warning" style="width: 85%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 pt-4">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 class="fw-bold mb-1">Quick Actions</h4>
          <p class="text-muted small mb-0">Frequently used management tools</p>
        </div>
      </div>
      
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card modern-card border-0 bg-white p-2">
            <button class="btn btn-link text-decoration-none d-flex align-items-center p-3 text-dark">
              <span class="bg-light p-3 rounded-4 me-3 fs-4">👥</span>
              <div class="text-start">
                <span class="d-block fw-bold mb-0">Student Directory</span>
                <span class="text-muted small">View & edit student info</span>
              </div>
            </button>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card modern-card border-0 bg-white p-2">
            <button class="btn btn-link text-decoration-none d-flex align-items-center p-3 text-dark">
              <span class="bg-light p-3 rounded-4 me-3 fs-4">📖</span>
              <div class="text-start">
                <span class="d-block fw-bold mb-0">Course Catalog</span>
                <span class="text-muted small">Manage syllabus & topics</span>
              </div>
            </button>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card modern-card border-0 bg-white p-2">
            <button class="btn btn-link text-decoration-none d-flex align-items-center p-3 text-dark">
              <span class="bg-light p-3 rounded-4 me-3 fs-4">⚙️</span>
              <div class="text-start">
                <span class="d-block fw-bold mb-0">System Setup</span>
                <span class="text-muted small">Configure staff & settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .icon-shape {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ls-1 { letter-spacing: 1px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.get('admin/stats').subscribe(res => {
      if (res.success) {
        this.stats = res.data;
      }
    });
  }
}
