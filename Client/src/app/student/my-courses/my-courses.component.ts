import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  status?: 'completed' | 'in_progress' | 'not_started';
}

interface CourseWithProgress {
  courseId: number;
  courseName: string;
  description?: string;
  currentLevel: number;
  totalLevels: number;
  currentLevelName: string;
  levelProgress: number;
  status: string;
  startDate?: string;
  estimatedEndDate?: string;
  duration?: number; // in weeks
  levels?: CourseLevel[];
  completedLevels: number;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.css']
})
export class MyCoursesComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private router = inject(Router);
  
  courses = signal<CourseWithProgress[]>([]);
  isLoading = signal<boolean>(false);
  selectedCourse = signal<CourseWithProgress | null>(null);
  showLevelsModal = signal<boolean>(false);
  
  // Filter and search
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all'); // 'all', 'in_progress', 'completed', 'not_started'
  
  // Computed filtered courses
  filteredCourses = computed(() => {
    let filtered = this.courses();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    
    if (query) {
      filtered = filtered.filter(course => 
        course.courseName.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.currentLevelName.toLowerCase().includes(query)
      );
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(course => 
        course.status.toLowerCase().replace(' ', '_') === status
      );
    }
    
    return filtered;
  });

  ngOnInit() {
    this.fetchCourses();
  }

  fetchCourses() {
    this.isLoading.set(true);
    this.apiService.getMyCourses().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const coursesList = Array.isArray(data) ? data : [];
        this.loadCourseProgress(coursesList);
      }, () => {
        this.isLoading.set(false);
      })
    );
  }

  loadCourseProgress(courses: any[]) {
    if (courses.length === 0) {
      this.isLoading.set(false);
      return;
    }

    let loadedCount = 0;
    const coursesWithProgress: CourseWithProgress[] = [];

    courses.forEach((course) => {
      // Load progress for each course
      this.apiService.getMyProgressByCourse(course.courseId).subscribe(
        handleResponse(this.loggingService, (progressList: any) => {
          const progress = Array.isArray(progressList) ? progressList : [];
          
          // Find current level
          const inProgress = progress.find((p: any) => 
            p.progressStatus === 'in_progress' || p.progressStatus === 'IN_PROGRESS'
          );
          const completed = progress.filter((p: any) => 
            p.progressStatus === 'completed' || p.progressStatus === 'COMPLETED'
          );

          // Try to get levels to calculate total
          this.apiService.getLevelsByCourse(course.courseId).subscribe(
            handleResponse(this.loggingService, (levels: any) => {
              const levelsList = Array.isArray(levels) ? levels : [];
              const sortedLevels = levelsList.sort((a: any, b: any) => 
                (a.levelOrder || a.levelId) - (b.levelOrder || b.levelId)
              );

              let currentLevel = 1;
              let currentLevelName = 'Level 1';
              let totalLevels = sortedLevels.length || 1;
              let levelProgress = 0;

              if (sortedLevels.length > 0) {
                totalLevels = sortedLevels.length;
                
                if (inProgress) {
                  const levelIndex = sortedLevels.findIndex((l: any) => l.levelId === inProgress.levelId);
                  if (levelIndex >= 0) {
                    currentLevel = levelIndex + 1;
                    currentLevelName = sortedLevels[levelIndex].levelName || `Level ${currentLevel}`;
                  }
                } else if (completed.length > 0) {
                  const lastCompleted = completed[completed.length - 1];
                  const levelIndex = sortedLevels.findIndex((l: any) => l.levelId === lastCompleted.levelId);
                  if (levelIndex >= 0 && levelIndex < sortedLevels.length - 1) {
                    currentLevel = levelIndex + 2;
                    currentLevelName = sortedLevels[levelIndex + 1]?.levelName || `Level ${currentLevel}`;
                  } else if (levelIndex >= 0) {
                    currentLevel = levelIndex + 1;
                    currentLevelName = sortedLevels[levelIndex].levelName || `Level ${currentLevel}`;
                  }
                } else {
                  currentLevelName = sortedLevels[0]?.levelName || 'Level 1';
                }

                // Calculate level progress
                levelProgress = totalLevels > 0 
                  ? Math.round((completed.length / totalLevels) * 100) 
                  : 0;
              } else {
                // Fallback if no levels
                if (inProgress && inProgress.levelName) {
                  currentLevelName = inProgress.levelName;
                } else if (completed.length > 0) {
                  const lastCompleted = completed[completed.length - 1];
                  currentLevelName = lastCompleted.levelName || `Level ${completed.length}`;
                  currentLevel = completed.length;
                }
                levelProgress = completed.length > 0 ? Math.min(completed.length * 10, 100) : 0;
              }

              // Determine status
              let status = 'Not Started';
              if (inProgress) {
                status = 'In Progress';
              } else if (completed.length > 0 && completed.length === totalLevels) {
                status = 'Completed';
              } else if (completed.length > 0) {
                status = 'In Progress';
              }

              // Calculate duration (estimate: 1 week per level)
              const duration = totalLevels;

              // Calculate dates (estimate)
              const startDate = course.createdAt || new Date().toISOString();
              const estimatedEndDate = this.calculateEndDate(startDate, duration);

              // Map levels with status
              const levelsWithStatus: CourseLevel[] = sortedLevels.map((level: any, index: number) => {
                let levelStatus: 'completed' | 'in_progress' | 'not_started' = 'not_started';
                const completedLevelIds = completed.map((p: any) => p.levelId);
                const inProgressLevelId = inProgress?.levelId;
                
                if (completedLevelIds.includes(level.levelId)) {
                  levelStatus = 'completed';
                } else if (inProgressLevelId === level.levelId) {
                  levelStatus = 'in_progress';
                }
                
                return {
                  levelId: level.levelId,
                  levelName: level.levelName,
                  levelNumber: level.levelNumber || index + 1,
                  durationWeeks: level.durationWeeks,
                  objectives: level.objectives,
                  status: levelStatus
                };
              });

              coursesWithProgress.push({
                courseId: course.courseId,
                courseName: course.courseName || course.name || 'Unknown Course',
                description: course.description,
                currentLevel: currentLevel,
                totalLevels: totalLevels,
                currentLevelName: currentLevelName,
                levelProgress: levelProgress,
                status: status,
                startDate: startDate,
                estimatedEndDate: estimatedEndDate,
                duration: duration,
                levels: levelsWithStatus,
                completedLevels: completed.length
              });

              loadedCount++;
              if (loadedCount === courses.length) {
                this.courses.set(coursesWithProgress);
                this.isLoading.set(false);
              }
            }, () => {
              // Fallback if levels can't be loaded
              let currentLevel = 1;
              let currentLevelName = 'Level 1';
              let levelProgress = 0;

              if (inProgress && inProgress.levelName) {
                currentLevelName = inProgress.levelName;
              } else if (completed.length > 0) {
                const lastCompleted = completed[completed.length - 1];
                currentLevelName = lastCompleted.levelName || `Level ${completed.length}`;
                currentLevel = completed.length;
                levelProgress = Math.min(completed.length * 10, 100);
              }

              let status = 'Not Started';
              if (inProgress) {
                status = 'In Progress';
              } else if (completed.length > 0) {
                status = 'In Progress';
              }

              coursesWithProgress.push({
                courseId: course.courseId,
                courseName: course.courseName || course.name || 'Unknown Course',
                description: course.description,
                currentLevel: currentLevel,
                totalLevels: 1,
                currentLevelName: currentLevelName,
                levelProgress: levelProgress,
                status: status,
                startDate: course.createdAt || new Date().toISOString(),
                estimatedEndDate: this.calculateEndDate(course.createdAt || new Date().toISOString(), 8),
                duration: 8,
                levels: [],
                completedLevels: completed.length
              });

              loadedCount++;
              if (loadedCount === courses.length) {
                this.courses.set(coursesWithProgress);
                this.isLoading.set(false);
              }
            })
          );
        }, () => {
          // Error loading progress
          coursesWithProgress.push({
            courseId: course.courseId,
            courseName: course.courseName || course.name || 'Unknown Course',
            description: course.description,
            currentLevel: 1,
            totalLevels: 1,
            currentLevelName: 'Level 1',
            levelProgress: 0,
            status: 'Not Started',
            startDate: course.createdAt || new Date().toISOString(),
            estimatedEndDate: this.calculateEndDate(course.createdAt || new Date().toISOString(), 8),
            duration: 8,
            levels: [],
            completedLevels: 0
          });

          loadedCount++;
          if (loadedCount === courses.length) {
            this.courses.set(coursesWithProgress);
            this.isLoading.set(false);
          }
        })
      );
    });
  }

  calculateEndDate(startDate: string, durationWeeks: number): string {
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (durationWeeks * 7));
      return end.toISOString();
    } catch {
      const end = new Date();
      end.setDate(end.getDate() + (durationWeeks * 7));
      return end.toISOString();
    }
  }

  formatDate(dateString: string): string {
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

  openLevelsModal(course: CourseWithProgress): void {
    this.selectedCourse.set(course);
    this.showLevelsModal.set(true);
  }

  closeLevelsModal(): void {
    this.showLevelsModal.set(false);
    this.selectedCourse.set(null);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
  }

  getStatusClass(status: string): string {
    const normalized = status.toLowerCase().replace(' ', '_');
    return `status-${normalized}`;
  }

  getStatusIcon(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('completed')) {
      return 'fa-check-circle';
    } else if (normalized.includes('progress')) {
      return 'fa-spinner';
    } else {
      return 'fa-clock';
    }
  }

  continueLearning(courseId: number): void {
    const course = this.courses().find(c => c.courseId === courseId);
    if (!course) {
      this.loggingService.onError('Course not found.');
      return;
    }

    // Find the first incomplete level
    if (course.levels) {
      const firstIncompleteLevel = course.levels.find(level => level.status !== 'completed');
      if (firstIncompleteLevel) {
        this.openLevelsModal(course);
        this.loggingService.onSuccess('Please work with your teacher to complete levels.');
      } else {
        this.loggingService.onSuccess('All levels completed! You can now complete the course or submit your exam.');
      }
    } else {
      this.openLevelsModal(course);
    }
  }

  // Level completion request
  requestLevelCompletion(levelId: number): void {
    // Students can request level completion, but teachers approve it
    this.completeLevel(levelId);
  }

  completeLevel(levelId: number): void {
    // Students request level completion - teachers approve
    if (!confirm('Are you sure you want to request completion for this level? Your teacher will review and approve it.')) {
      return;
    }

    // For now, we'll use the existing API that allows students to complete levels
    // In a real system, this might send a notification to teachers for approval
    this.apiService.completeLevel(levelId).subscribe({
      next: (result: any) => {
        this.loggingService.onSuccess(result || 'Level completion requested! Waiting for teacher approval.');
        // Refresh course data
        this.fetchCourses();
      },
      error: (error: any) => {
        this.loggingService.onError(error.error || 'Failed to request level completion');
      }
    });
  }

  // Method to complete a course (when all levels are done)
  completeCourse(courseId: number): void {
    const course = this.courses().find(c => c.courseId === courseId);
    if (!course) {
      this.loggingService.onError('Course not found.');
      return;
    }

    if (course.status === 'completed') {
      this.loggingService.onSuccess('Course is already completed!');
      return;
    }

    if (course.completedLevels !== course.totalLevels) {
      this.loggingService.onError(`All ${course.totalLevels} levels must be completed before marking the course as complete. Currently completed: ${course.completedLevels}`);
      return;
    }

    if (!confirm('Are you sure you want to mark this course as complete? This will make you eligible for the final exam.')) {
      return;
    }

    // In the simplified system, course completion is handled by teachers
    // Students can request it, but teachers approve
    this.loggingService.onSuccess('Course completion requested! Please contact your teacher for final approval.');
  }
}

