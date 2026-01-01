import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface CourseLevel {
  levelId: number;
  levelName: string;
  levelNumber: number;
  durationWeeks?: number;
  objectives?: string;
}

interface ProgressRecord {
  progressId: number;
  studentId: number;
  courseId: number;
  levelId: number;
  progressStatus: string;
  completionDate?: string;
  remarks?: string;
  levelName?: string;
}

interface CourseProgress {
  courseId: number;
  courseName: string;
  description?: string;
  totalLevels: number;
  completedLevels: number;
  inProgressLevels: number;
  notStartedLevels: number;
  overallProgress: number;
  levels: CourseLevel[];
  progressRecords: ProgressRecord[];
  lastUpdated?: string;
}

interface OverallStats {
  totalCourses: number;
  totalLevels: number;
  completedLevels: number;
  inProgressLevels: number;
  averageProgress: number;
}

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-progress.component.html',
  styleUrls: ['./my-progress.component.css']
})
export class MyProgressComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private router = inject(Router);

  // Data signals
  courses = signal<CourseProgress[]>([]);
  isLoading = signal<boolean>(true);
  selectedCourseId = signal<number | null>(null);

  // Computed values
  overallStats = computed(() => {
    const coursesList = this.courses();
    if (coursesList.length === 0) {
      return {
        totalCourses: 0,
        totalLevels: 0,
        completedLevels: 0,
        inProgressLevels: 0,
        averageProgress: 0
      };
    }

    const totalCourses = coursesList.length;
    const totalLevels = coursesList.reduce((sum, c) => sum + c.totalLevels, 0);
    const completedLevels = coursesList.reduce((sum, c) => sum + c.completedLevels, 0);
    const inProgressLevels = coursesList.reduce((sum, c) => sum + c.inProgressLevels, 0);
    const averageProgress = totalCourses > 0
      ? Math.round(coursesList.reduce((sum, c) => sum + c.overallProgress, 0) / totalCourses)
      : 0;

    return {
      totalCourses,
      totalLevels,
      completedLevels,
      inProgressLevels,
      averageProgress
    };
  });

  selectedCourse = computed(() => {
    const courseId = this.selectedCourseId();
    if (!courseId) return null;
    return this.courses().find(c => c.courseId === courseId) || null;
  });

  ngOnInit(): void {
    this.loadProgressData();
  }

  loadProgressData(): void {
    this.isLoading.set(true);

    // Load all courses
    this.apiService.getMyCourses().subscribe(
      handleResponse(this.loggingService, (courses: any) => {
        const coursesList = Array.isArray(courses) ? courses : [];
        
        if (coursesList.length === 0) {
          this.courses.set([]);
          this.isLoading.set(false);
          return;
        }

        // Load progress for each course
        let loadedCount = 0;
        const coursesWithProgress: CourseProgress[] = [];

        coursesList.forEach((course: any) => {
          // Load progress records
          this.apiService.getMyProgressByCourse(course.courseId).subscribe(
            handleResponse(this.loggingService, (progressList: any) => {
              const progress = Array.isArray(progressList) ? progressList : [];
              
              // Load course levels using student endpoint
              this.apiService.getCourseLevelsForStudent(course.courseId).subscribe(
                handleResponse(this.loggingService, (levels: any) => {
                  const levelsList = Array.isArray(levels) ? levels : [];
                  const sortedLevels = levelsList.sort((a: any, b: any) => 
                    (a.levelNumber || a.levelId) - (b.levelNumber || b.levelId)
                  );

                  // Process progress records
                  const completed = progress.filter((p: any) => 
                    p.progressStatus === 'completed' || p.progressStatus === 'COMPLETED'
                  );
                  const inProgress = progress.filter((p: any) => 
                    p.progressStatus === 'in_progress' || p.progressStatus === 'IN_PROGRESS'
                  );
                  const notStarted = progress.filter((p: any) => 
                    p.progressStatus === 'not_started' || p.progressStatus === 'NOT_STARTED'
                  );

                  // Map levels with progress
                  const levelsWithProgress: CourseLevel[] = sortedLevels.map((level: any) => {
                    const levelProgress = progress.find((p: any) => p.levelId === level.levelId);
                    return {
                      levelId: level.levelId,
                      levelName: level.levelName,
                      levelNumber: level.levelNumber || 0,
                      durationWeeks: level.durationWeeks,
                      objectives: level.objectives
                    };
                  });

                  // Calculate overall progress
                  const totalLevels = sortedLevels.length || 1;
                  const overallProgress = totalLevels > 0
                    ? Math.round((completed.length / totalLevels) * 100)
                    : 0;

                  // Find last updated date
                  const allDates = progress
                    .map((p: any) => p.completionDate || p.updatedAt)
                    .filter((d: any) => d)
                    .sort()
                    .reverse();
                  const lastUpdated = allDates.length > 0 ? allDates[0] : undefined;

                  coursesWithProgress.push({
                    courseId: course.courseId,
                    courseName: course.courseName || course.name || 'Unknown Course',
                    description: course.description,
                    totalLevels: totalLevels,
                    completedLevels: completed.length,
                    inProgressLevels: inProgress.length,
                    notStartedLevels: notStarted.length,
                    overallProgress: overallProgress,
                    levels: levelsWithProgress,
                    progressRecords: progress,
                    lastUpdated: lastUpdated
                  });

                  loadedCount++;
                  if (loadedCount === coursesList.length) {
                    // Sort by overall progress (descending)
                    coursesWithProgress.sort((a, b) => b.overallProgress - a.overallProgress);
                    this.courses.set(coursesWithProgress);
                    this.isLoading.set(false);
                  }
                }, () => {
                  // Fallback if levels can't be loaded
                  const totalLevels = 1;
                  const completed = progress.filter((p: any) => 
                    p.progressStatus === 'completed' || p.progressStatus === 'COMPLETED'
                  );
                  const overallProgress = Math.min(completed.length * 10, 100);

                  coursesWithProgress.push({
                    courseId: course.courseId,
                    courseName: course.courseName || course.name || 'Unknown Course',
                    description: course.description,
                    totalLevels: totalLevels,
                    completedLevels: completed.length,
                    inProgressLevels: 0,
                    notStartedLevels: 0,
                    overallProgress: overallProgress,
                    levels: [],
                    progressRecords: progress,
                    lastUpdated: undefined
                  });

                  loadedCount++;
                  if (loadedCount === coursesList.length) {
                    coursesWithProgress.sort((a, b) => b.overallProgress - a.overallProgress);
                    this.courses.set(coursesWithProgress);
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
                totalLevels: 0,
                completedLevels: 0,
                inProgressLevels: 0,
                notStartedLevels: 0,
                overallProgress: 0,
                levels: [],
                progressRecords: [],
                lastUpdated: undefined
              });

              loadedCount++;
              if (loadedCount === coursesList.length) {
                coursesWithProgress.sort((a, b) => b.overallProgress - a.overallProgress);
                this.courses.set(coursesWithProgress);
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

  selectCourse(courseId: number): void {
    if (this.selectedCourseId() === courseId) {
      this.selectedCourseId.set(null);
    } else {
      this.selectedCourseId.set(courseId);
    }
  }

  getLevelStatus(level: CourseLevel, course: CourseProgress): 'completed' | 'in_progress' | 'not_started' {
    const progress = course.progressRecords.find(p => p.levelId === level.levelId);
    if (!progress) return 'not_started';
    
    const status = progress.progressStatus?.toLowerCase();
    if (status === 'completed') return 'completed';
    if (status === 'in_progress') return 'in_progress';
    return 'not_started';
  }

  getLevelProgress(level: CourseLevel, course: CourseProgress): number {
    const status = this.getLevelStatus(level, course);
    if (status === 'completed') return 100;
    if (status === 'in_progress') return 50;
    return 0;
  }

  getLevelRemarks(level: CourseLevel, course: CourseProgress): string | undefined {
    const progress = course.progressRecords.find(p => p.levelId === level.levelId);
    return progress?.remarks;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  viewCourseDetails(courseId: number): void {
    this.router.navigate(['/student/courses'], { queryParams: { courseId } });
  }
}

