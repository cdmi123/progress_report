import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="animate-fade-in" *ngIf="data">
      <div class="row g-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <a routerLink="/dashboard" class="btn btn-light rounded-pill px-4 shadow-sm fw-medium small text-primary d-flex align-items-center">
              <span class="me-2 fs-5">←</span> Back to Dashboard
            </a>
            <div class="text-end">
              <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-bold">Live Tracking</span>
            </div>
          </div>

          <div class="card glass-card border-0 p-4 mb-4 rounded-4 shadow-sm">
            <div class="row align-items-center">
              <div class="col-md-auto mb-3 mb-md-0">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 64px; height: 64px; font-size: 1.5rem;">
                  {{ data.student.name.charAt(0) }}
                </div>
              </div>
              <div class="col">
                <h2 class="fw-bold text-dark mb-1">{{ data.student.name }}</h2>
                <div class="d-flex flex-wrap gap-3">
                  <span class="text-muted small d-flex align-items-center">
                    <span class="me-1">📚</span> {{ data.report.course.name }}
                  </span>
                  <span class="text-muted small d-flex align-items-center">
                    <span class="me-1">👨‍🏫</span> Faculty: {{ data.student.facultyName?.name || 'Assigned Soon' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 mb-5">
          <div class="card modern-card border-0 overflow-hidden">
            <div class="card-header bg-white py-3 px-4 border-0 border-bottom">
              <h5 class="fw-bold mb-0">Topic Progress Tracker</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light bg-opacity-50">
                  <tr>
                    <th class="ps-4 fw-bold text-muted small text-uppercase ls-1" style="width: 80px;">S.No</th>
                    <th class="fw-bold text-muted small text-uppercase ls-1">Learning Module / Topic</th>
                    <th class="fw-bold text-muted small text-uppercase ls-1 text-center" style="width: 150px;">Status</th>
                    <th class="fw-bold text-muted small text-uppercase ls-1" style="width: 220px;">Completion Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let topic of data.report.topics; let i = index" class="border-bottom-0">
                    <td class="ps-4 text-muted">{{ i + 1 }}</td>
                    <td>
                      <div class="fw-bold text-dark">{{ topic.topicTitle }}</div>
                      <div class="text-muted small" *ngIf="topic.isChecked">Completed</div>
                      <div class="text-muted small" *ngIf="!topic.isChecked">Pending Review</div>
                    </td>
                    <td class="text-center">
                      <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input shadow-none cursor-pointer" type="checkbox" 
                               style="width: 2.5rem; height: 1.25rem;"
                               [(ngModel)]="topic.isChecked" 
                               (change)="updateProgress(i)">
                      </div>
                    </td>
                    <td>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-transparent border-0 pe-1">📅</span>
                        <input type="date" class="form-control border-0 bg-light rounded-3 px-2" 
                               [(ngModel)]="topic.date" 
                               (blur)="updateProgress(i)"
                               [disabled]="!topic.isChecked">
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ls-1 { letter-spacing: 1px; }
    .cursor-pointer { cursor: pointer; }
    .table > :not(caption) > * > * { border-bottom-width: 0; }
    tbody tr { transition: background-color 0.2s ease; border-bottom: 1px solid #f0f0f0 !important; }
    tbody tr:hover { background-color: rgba(67, 97, 238, 0.02) !important; }
    .form-check-input:checked { background-color: var(--primary); border-color: var(--primary); }
  `]
})
export class ReportDetailComponent implements OnInit {
  data: any = null;

  constructor(private route: ActivatedRoute, private api: ApiService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadReport(params['studentId'], params['courseId']);
    });
  }

  loadReport(studentId: string, courseId: string) {
    this.api.get('reports/details', { studentId, courseId }).subscribe(res => {
      if (res.success) {
        this.data = res.data;
      }
    });
  }

  updateProgress(index: number) {
    const topic = this.data.report.topics[index];
    const updateData = {
      reportId: this.data.report._id,
      topicIndex: index,
      isChecked: topic.isChecked,
      date: topic.date
    };

    this.api.post('reports/update-progress', updateData).subscribe(res => {
      if (res.success) {
        console.log('Progress updated');
      }
    });
  }
}
