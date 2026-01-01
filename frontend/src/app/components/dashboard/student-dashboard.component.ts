import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-section mb-5 pt-2">
      <h2 class="fw-bold text-dark mb-1">Your Progress</h2>
      <p class="text-muted">Keep track of your learning journey across all courses.</p>
    </div>

    <div class="row g-4">
      <div class="col-md-6 col-lg-4" *ngFor="let student of studentData">
        <div class="card modern-card h-100 overflow-hidden border-0">
          <div class="p-4 bg-light border-bottom">
            <h5 class="fw-bold text-dark mb-0">{{ student.name }}</h5>
            <span class="badge bg-primary-subtle text-primary rounded-pill mt-2">Active Enrollment</span>
          </div>
          <div class="card-body p-4">
            <div *ngFor="let prog of student.courseProgress" class="mb-0">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="fw-bold mb-0 text-dark">{{ prog.courseName }}</h6>
                  <span class="text-muted small">Overall Completion</span>
                </div>
                <div class="text-end">
                  <h4 class="fw-bold text-primary mb-0">{{ prog.percent }}%</h4>
                </div>
              </div>
              
              <div class="progress rounded-pill mb-4" style="height: 12px; background: #eaecff;">
                <div class="progress-bar progress-bar-striped progress-bar-animated rounded-pill shadow-sm" 
                     role="progressbar" 
                     [style.width.%]="prog.percent" 
                     [attr.aria-valuenow]="prog.percent" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
              </div>

              <button class="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                View Learning Map <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder for adding more courses -->
      <div class="col-md-6 col-lg-4">
        <div class="card modern-card h-100 border-2 border-dashed bg-transparent d-flex align-items-center justify-content-center p-5 text-center" style="border-style: dashed; border-color: #dee2e6;">
          <div>
            <div class="bg-white shadow-sm rounded-circle d-inline-flex p-3 mb-3">
              <span class="fs-3 text-muted">➕</span>
            </div>
            <h6 class="fw-bold text-muted mb-0">New Course?</h6>
            <p class="text-muted small">Add another unit to track</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  studentData: any[] = [];

  constructor(private api: ApiService, private auth: AuthService) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.api.get(`reports/details`, { studentId: user.id }).subscribe(res => {
      if (res.success) {
        // Wrap and transform data to match template expectation
        // Note: The structure might vary slightly depending on API response
        this.studentData = [{
          name: res.data.student.name,
          courseProgress: [{
            courseName: res.data.report.course.name,
            percent: this.calculateProgress(res.data.report.topics)
          }]
        }];
      }
    });
  }

  calculateProgress(topics: any[]): number {
    if (!topics || topics.length === 0) return 0;
    const completed = topics.filter(t => t.isChecked).length;
    return Math.round((completed / topics.length) * 100);
  }
}
