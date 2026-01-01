import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface StudentProgress {
  progressId?: number;
  studentId: number;
  courseId: number;
  levelId: number;
  progressStatus: string;
  completionDate?: string;
  remarks?: string;
}

interface CourseLevel {
  levelId: number;
  levelName: string;
  courseId: number;
  levelOrder?: number;
}

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-progress.component.html',
  styleUrls: ['./student-progress.component.css'],
})
export class StudentProgressComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Route params
  studentId = signal<number | null>(null);
  courseId = signal<number | null>(null);

  // Data
  studentName = signal<string>('');
  courseName = signal<string>('');
  currentLevel = signal<CourseLevel | null>(null);
  currentProgress = signal<StudentProgress | null>(null);
  allLevels = signal<CourseLevel[]>([]);
  nextLevel = signal<CourseLevel | null>(null);
  progressPercentage = signal<number>(0);
  status = signal<string>('not_started');
  remarks = signal<string>('');

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const studentId = params['studentId']
        ? parseInt(params['studentId'])
        : null;
      const courseId = params['courseId'] ? parseInt(params['courseId']) : null;

      if (studentId && courseId) {
        this.studentId.set(studentId);
        this.courseId.set(courseId);
        this.loadData();
      } else {
        this.loggingService.onError('Invalid student or course ID');
        this.router.navigate(['/teacher/students']);
      }
    });
  }

  loadData() {
    const studentId = this.studentId();
    const courseId = this.courseId();

    if (!studentId || !courseId) return;

    this.isLoading.set(true);

    // Load student and course info from IDs (teachers don't have access to admin course endpoints)
    // Use simple placeholders for now; names are mainly visible in the previous page
    this.studentName.set(`Student ${studentId}`);
    this.courseName.set(`Course ${courseId}`);

    // Load course levels using teacher endpoint
    this.apiService.getLevelsByCourseForTeacher(courseId).subscribe(
      handleResponse(
        this.loggingService,
        (levels: any) => {
          const sortedLevels = (Array.isArray(levels) ? levels : []).sort(
            (a: any, b: any) => {
              return (a.levelOrder || a.levelId) - (b.levelOrder || b.levelId);
            }
          );
          this.allLevels.set(sortedLevels);
          this.loadProgressData();
          this.checkLoadingComplete();
        },
        () => {
          this.checkLoadingComplete();
        }
      )
    );
  }

  loadProgressData() {
    const studentId = this.studentId();
    const courseId = this.courseId();

    if (!studentId || !courseId) return;

    this.isLoading.set(true);

    // Get student progress for this course
    this.apiService.getStudentProgress(studentId, courseId).subscribe(
      handleResponse(this.loggingService, (progressData: any) => {
        const data = Array.isArray(progressData) ? progressData : [];
        this.processProgressData(data);
        this.isLoading.set(false);
      }, () => {
        this.isLoading.set(false);
        // If no progress data exists, initialize with first level
        this.initializeDefaultProgress();
      })
    );
  }

  processProgressData(progressData: any[]) {
    const levels = this.allLevels();

    if (progressData.length === 0) {
      this.initializeDefaultProgress();
      return;
    }

    // Find the current level (last in_progress or most recent completed)
    let currentProgress = null;
    let currentLevel = null;

    // Sort progress by level order to find current position
    const sortedProgress = progressData.sort((a, b) => {
      const levelA = levels.find(l => l.levelId === a.levelId);
      const levelB = levels.find(l => l.levelId === b.levelId);
      return (levelA?.levelOrder || 0) - (levelB?.levelOrder || 0);
    });

    // Find the current level (in_progress) or the last completed level
    const inProgressLevel = sortedProgress.find(p => p.progressStatus === 'in_progress');
    const lastCompleted = [...sortedProgress].reverse().find(p => p.progressStatus === 'completed');

    if (inProgressLevel) {
      currentProgress = inProgressLevel;
      currentLevel = levels.find(l => l.levelId === inProgressLevel.levelId);
    } else if (lastCompleted) {
      currentProgress = lastCompleted;
      currentLevel = levels.find(l => l.levelId === lastCompleted.levelId);
    }

    if (currentLevel) {
      this.currentLevel.set(currentLevel);
      this.status.set(currentProgress?.progressStatus || 'not_started');
      this.remarks.set(currentProgress?.remarks || '');
    } else {
      // If no progress, start with first level
      this.initializeDefaultProgress();
    }

    // Calculate progress percentage
    const completedLevels = sortedProgress.filter(p => p.progressStatus === 'completed').length;
    const totalLevels = levels.length;
    const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
    this.progressPercentage.set(percentage);

    // Find next level
    if (currentLevel) {
      const currentIndex = levels.findIndex(l => l.levelId === currentLevel.levelId);
      if (currentIndex < levels.length - 1 && currentProgress?.progressStatus === 'completed') {
        this.nextLevel.set(levels[currentIndex + 1]);
      } else {
        this.nextLevel.set(null);
      }
    }
  }

  initializeDefaultProgress() {
    const levels = this.allLevels();
    if (levels.length > 0) {
      this.currentLevel.set(levels[0]);
      this.status.set('not_started');
      this.progressPercentage.set(0);
      this.remarks.set('');
      this.nextLevel.set(levels.length > 1 ? levels[1] : null);
    }
  }

  markLevelCompleted() {
    const studentId = this.studentId();
    const courseId = this.courseId();
    const currentLevel = this.currentLevel();

    if (!studentId || !courseId || !currentLevel) {
      this.loggingService.onError('Missing required information');
      return;
    }

    this.isSaving.set(true);
    const remarks = this.remarks().trim();

    this.apiService
      .updateStudentLevel(
        studentId,
        courseId,
        currentLevel.levelId,
        'completed',
        remarks || undefined
      )
      .subscribe(
        handleResponse(
          this.loggingService,
          (data: any) => {
            this.loggingService.onSuccess(
              'Level marked as completed successfully!'
            );
            this.loadProgressData();
            this.isSaving.set(false);
          },
          () => {
            this.isSaving.set(false);
          }
        )
      );
  }

  assignNextLevel() {
    const studentId = this.studentId();
    const courseId = this.courseId();
    const nextLevel = this.nextLevel();

    if (!studentId || !courseId || !nextLevel) {
      this.loggingService.onError(
        'No next level available or missing information'
      );
      return;
    }

    this.isSaving.set(true);
    const remarks = this.remarks().trim();

    this.apiService
      .updateStudentLevel(
        studentId,
        courseId,
        nextLevel.levelId,
        'in_progress',
        remarks || undefined
      )
      .subscribe(
        handleResponse(
          this.loggingService,
          (data: any) => {
            this.loggingService.onSuccess('Next level assigned successfully!');
            this.currentLevel.set(nextLevel);
            this.loadProgressData();
            this.remarks.set('');
            this.isSaving.set(false);
          },
          () => {
            this.isSaving.set(false);
          }
        )
      );
  }

  private checkLoadingComplete() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 300);
  }

  goBack() {
    this.router.navigate(['/teacher/students']);
  }

  getStatusDisplay(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
      default:
        return status || 'Not Started';
    }
  }
}
