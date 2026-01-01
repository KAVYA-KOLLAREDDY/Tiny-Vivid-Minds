import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Course {
  courseId: number;
  courseName: string;
  description?: string;
  currentLevel?: string;
  currentLevelId?: number;
  progress: number;
  totalLevels?: number;
  completedLevels?: number;
}

interface NextClass {
  date: string;
  time: string;
  teacherName: string;
  courseName: string;
  classId?: number;
}

interface DashboardStats {
  totalCourses: number;
  attendancePercentage: number;
  completedLevels: number;
  pendingExams: number;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private loggingService = inject(LoggingService);

  // Data signals
  studentName = signal<string>('');
  courses = signal<Course[]>([]);
  nextClass = signal<NextClass | null>(null);
  stats = signal<DashboardStats>({
    totalCourses: 0,
    attendancePercentage: 0,
    completedLevels: 0,
    pendingExams: 0
  });
  isLoading = signal<boolean>(true);

  // Computed values
  activeCourse = computed(() => {
    const coursesList = this.courses();
    return coursesList.length > 0 ? coursesList[0] : null;
  });

  recentCourses = computed(() => {
    return this.courses().slice(0, 3);
  });

  ngOnInit(): void {
    this.loadStudentName();
    this.loadDashboardData();
  }

  loadStudentName(): void {
    const user = this.authService.currentUser();
    if (user) {
      // Try different possible name fields
      const name = user.name || user.fullName || user.username || 'Student';
      this.studentName.set(name);
    } else {
      this.studentName.set('Student');
    }
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Load all courses with progress
    this.apiService.getMyCourses().subscribe(
      handleResponse(this.loggingService, (courses: any) => {
        const coursesList = Array.isArray(courses) ? courses : [];
        
        if (coursesList.length === 0) {
          this.courses.set([]);
          this.updateStats();
          this.isLoading.set(false);
          return;
        }

        // Load progress for all courses
        let loadedCount = 0;
        const coursesWithProgress: Course[] = [];

        coursesList.forEach((course: any) => {
          this.apiService.getMyProgressByCourse(course.courseId).subscribe(
            handleResponse(this.loggingService, (progressList: any) => {
              const progress = Array.isArray(progressList) ? progressList : [];
              const completed = progress.filter((p: any) => 
                p.progressStatus === 'completed' || p.progressStatus === 'COMPLETED'
              );
              const inProgress = progress.find((p: any) => 
                p.progressStatus === 'in_progress' || p.progressStatus === 'IN_PROGRESS'
              );

              // Get level info
              let currentLevel = 'Not Started';
              let currentLevelId: number | undefined;
              let progressPercent = 0;

              if (inProgress && inProgress.levelName) {
                currentLevel = inProgress.levelName;
                currentLevelId = inProgress.levelId;
              } else if (completed.length > 0) {
                const lastCompleted = completed[completed.length - 1];
                currentLevel = lastCompleted.levelName || `Level ${lastCompleted.levelId}`;
                currentLevelId = lastCompleted.levelId;
              }

              // Try to get total levels
              this.apiService.getLevelsByCourse(course.courseId).subscribe(
                handleResponse(this.loggingService, (levels: any) => {
                  const levelsList = Array.isArray(levels) ? levels : [];
                  const totalLevels = levelsList.length;
                  
                  if (totalLevels > 0) {
                    progressPercent = Math.round((completed.length / totalLevels) * 100);
                  } else {
                    progressPercent = completed.length > 0 ? Math.min(completed.length * 10, 100) : 0;
                  }

                  coursesWithProgress.push({
                    courseId: course.courseId,
                    courseName: course.courseName || course.name || 'Unknown Course',
                    description: course.description,
                    currentLevel: currentLevel,
                    currentLevelId: currentLevelId,
                    progress: progressPercent,
                    totalLevels: totalLevels,
                    completedLevels: completed.length
                  });

                  loadedCount++;
                  if (loadedCount === coursesList.length) {
                    this.courses.set(coursesWithProgress);
                    this.updateStats();
                    this.loadNextClass();
                    this.calculateAttendance();
                    this.isLoading.set(false);
                  }
                }, () => {
                  // Fallback if levels can't be loaded
                  progressPercent = completed.length > 0 ? Math.min(completed.length * 10, 100) : 0;
                  
                  coursesWithProgress.push({
                    courseId: course.courseId,
                    courseName: course.courseName || course.name || 'Unknown Course',
                    description: course.description,
                    currentLevel: currentLevel,
                    currentLevelId: currentLevelId,
                    progress: progressPercent,
                    totalLevels: 0,
                    completedLevels: completed.length
                  });

                  loadedCount++;
                  if (loadedCount === coursesList.length) {
                    this.courses.set(coursesWithProgress);
                    this.updateStats();
                    this.loadNextClass();
                    this.calculateAttendance();
                    this.isLoading.set(false);
                  }
                })
              );
            }, () => {
              // Fallback if progress can't be loaded
              coursesWithProgress.push({
                courseId: course.courseId,
                courseName: course.courseName || course.name || 'Unknown Course',
                description: course.description,
                currentLevel: 'Not Started',
                progress: 0,
                totalLevels: 0,
                completedLevels: 0
              });

              loadedCount++;
              if (loadedCount === coursesList.length) {
                this.courses.set(coursesWithProgress);
                this.updateStats();
                this.loadNextClass();
                this.calculateAttendance();
                this.isLoading.set(false);
              }
            })
          );
        });
      }, () => {
        this.isLoading.set(false);
      })
    );
  }

  updateStats(): void {
    const coursesList = this.courses();
    const totalCourses = coursesList.length;
    const completedLevels = coursesList.reduce((sum, course) => sum + (course.completedLevels || 0), 0);
    
    this.stats.set({
      totalCourses: totalCourses,
      attendancePercentage: this.stats().attendancePercentage, // Will be updated by calculateAttendance
      completedLevels: completedLevels,
      pendingExams: 0 // Placeholder - would need exam submission API
    });
  }


  loadNextClass(): void {
    // For students, we might need a student-specific calendar endpoint
    // For now, we'll try to get schedule information from assignments
    // This is a placeholder - in a real app, you'd have a student calendar endpoint
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    // Note: This might not work for students - you may need a student calendar endpoint
    // For now, setting a placeholder
    this.nextClass.set(null);
  }

  calculateAttendance(): void {
    // Calculate attendance percentage
    // This would typically come from attendance records
    // For now, using a placeholder value
    // In a real app, you'd fetch attendance data and calculate the percentage
    const attendance = 90; // Placeholder
    this.stats.update(s => ({ ...s, attendancePercentage: attendance }));
  }

  viewMyCourses(): void {
    this.router.navigate(['/student/courses']);
  }

  viewCourseDetails(courseId: number): void {
    this.router.navigate(['/student/courses'], { queryParams: { courseId } });
  }

  submitExam(): void {
    this.router.navigate(['/student/exam-submission']);
  }

  viewAttendance(): void {
    this.router.navigate(['/student/attendance']);
  }

  downloadCertificate(): void {
    this.router.navigate(['/student/certificates']);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'TBD';
    // If already in HH:mm format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    return timeString;
  }
}

