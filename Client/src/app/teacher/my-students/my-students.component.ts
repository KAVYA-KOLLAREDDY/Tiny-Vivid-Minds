import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface StudentAssignment {
  assignmentId: number;
  studentId: number;
  teacherId: number;
  courseId: number;
  startDate?: string;
  preferredTime?: string;
  status?: string;
  studentName?: string;
  courseName?: string;
  student?: {
    userId: number;
    fullName: string;
    name?: string;
  };
  course?: {
    courseId: number;
    courseName: string;
  };
}

interface StudentData {
  assignmentId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  currentLevel: string;
  currentLevelId?: number;
  progress: number;
  nextClassDate: string | null;
  status: string;
}

interface Course {
  courseId: number;
  courseName: string;
}

interface CourseLevel {
  levelId: number;
  levelName: string;
  courseId: number;
  levelOrder?: number;
}

interface StudentProgressData {
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  currentLevel: CourseLevel | null;
  allLevels: CourseLevel[];
  nextLevel: CourseLevel | null;
  progressPercentage: number;
  status: string;
  remarks: string;
}

@Component({
  selector: 'app-my-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-students.component.html',
  styleUrls: ['./my-students.component.css'],
})
export class MyStudentsComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private router = inject(Router);

  // Raw data
  assignments = signal<StudentAssignment[]>([]);
  courses = signal<Course[]>([]);
  students = signal<any[]>([]);
  schedules = signal<any[]>([]);
  levels = signal<Map<number, CourseLevel[]>>(new Map());

  // Processed data
  studentData = signal<StudentData[]>([]);
  isLoading = signal<boolean>(false);

  // Filters
  selectedCourseId = signal<number | null>(null);
  selectedLevelId = signal<number | null>(null);

  // Progress Modal
  showProgressModal = signal<boolean>(false);
  progressData = signal<StudentProgressData | null>(null);
  isLoadingProgress = signal<boolean>(false);
  progressRemarks = signal<string>('');

  // Computed filtered data
  filteredStudents = computed(() => {
    let filtered = this.studentData();

    if (this.selectedCourseId() !== null) {
      filtered = filtered.filter(
        (s) => s.courseId === this.selectedCourseId()!
      );
    }

    if (this.selectedLevelId() !== null) {
      filtered = filtered.filter(
        (s) => s.currentLevelId === this.selectedLevelId()!
      );
    }

    return filtered;
  });

  // Available courses for filter
  availableCourses = computed(() => {
    const courseIds = new Set(this.studentData().map((s) => s.courseId));
    return this.courses().filter((c) => courseIds.has(c.courseId));
  });

  // Available levels for filter
  availableLevels = computed(() => {
    const courseId = this.selectedCourseId();
    if (courseId === null) {
      // Get all levels from all courses
      const allLevels: CourseLevel[] = [];
      this.levels().forEach((levels) => {
        allLevels.push(...levels);
      });
      return allLevels;
    }
    return this.levels().get(courseId) || [];
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading.set(true);

    // Load assignments
    this.apiService.getMyStudents().subscribe(
      handleResponse(
        this.loggingService,
        (data: any) => {
          const assignmentsArray = Array.isArray(data) ? data : [];
          // Map assignments to include names if available
          const mappedAssignments: StudentAssignment[] = assignmentsArray.map(
            (assignment: any) => ({
              assignmentId: assignment.assignmentId || assignment.id,
              studentId: assignment.studentId || assignment.student?.userId,
              teacherId: assignment.teacherId || assignment.teacher?.userId,
              courseId: assignment.courseId || assignment.course?.courseId,
              startDate: assignment.startDate || assignment.start_date,
              preferredTime:
                assignment.preferredTime || assignment.preferred_time,
              status: assignment.status || 'ACTIVE',
              studentName:
                assignment.studentName ||
                assignment.student?.fullName ||
                assignment.student?.name,
              courseName:
                assignment.courseName || assignment.course?.courseName,
              student: assignment.student,
              course: assignment.course,
            })
          );
          this.assignments.set(mappedAssignments);
          this.processStudentData();
          this.checkLoadingComplete();
        },
        () => {
          this.assignments.set([]);
          this.checkLoadingComplete();
        }
      )
    );

    // Extract courses from assignments (teachers don't have access to getAllCourses)
    // We'll build course list from assignments
    this.extractCoursesFromAssignments();

    // Extract student info from assignments (teachers don't have access to getUsersByRole)
    // We'll work with studentIds from assignments
    this.extractStudentsFromAssignments();

    // Load calendar data for next class dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2);

    this.apiService
      .getMyCalendar(startDate.toISOString(), endDate.toISOString())
      .subscribe(
        handleResponse(
          this.loggingService,
          (data: any) => {
            this.schedules.set(Array.isArray(data) ? data : []);
            this.processStudentData();
            this.checkLoadingComplete();
          },
          () => {
            this.schedules.set([]);
            this.checkLoadingComplete();
          }
        )
      );
  }

  extractStudentsFromAssignments() {
    const assignments = this.assignments();
    const uniqueStudentIds = new Set(assignments.map((a) => a.studentId));

    // Create student objects, using names from assignments if available
    const studentsList: any[] = Array.from(uniqueStudentIds).map(
      (studentId) => {
        // Find assignment with this studentId to get name
        const assignment = assignments.find((a) => a.studentId === studentId);
        const studentName =
          assignment?.studentName ||
          assignment?.student?.fullName ||
          assignment?.student?.name ||
          `Student ${studentId}`;

        return {
          userId: studentId,
          fullName: studentName,
          name: studentName,
        };
      }
    );

    this.students.set(studentsList);
    this.processStudentData();
    this.checkLoadingComplete();
  }

  extractCoursesFromAssignments() {
    const assignments = this.assignments();
    const uniqueCourseIds = new Set(assignments.map((a) => a.courseId));

    // Create course objects, using names from assignments if available
    const coursesList: Course[] = Array.from(uniqueCourseIds).map(
      (courseId) => {
        // Find assignment with this courseId to get name
        const assignment = assignments.find((a) => a.courseId === courseId);
        const courseName =
          assignment?.courseName ||
          assignment?.course?.courseName ||
          `Course ${courseId}`;

        return {
          courseId,
          courseName: courseName, // Will be updated if we can fetch from API
        };
      }
    );

    this.courses.set(coursesList);

    // Try to fetch course details for each unique course
    // Note: This uses admin endpoint, so it might fail for teachers
    uniqueCourseIds.forEach((courseId) => {
      this.apiService.getCourseById(courseId).subscribe(
        handleResponse(
          this.loggingService,
          (course: any) => {
            this.courses.update((courses) => {
              const index = courses.findIndex((c) => c.courseId === courseId);
              if (index >= 0 && course.courseName) {
                courses[index].courseName = course.courseName;
              }
              return [...courses];
            });
            this.loadLevelsForCourse(courseId);
          },
          () => {
            // If fetching fails (403), continue with placeholder names
            // Still try to load levels
            this.loadLevelsForCourse(courseId);
          }
        )
      );
    });

    this.checkLoadingComplete();
  }

  loadLevelsForCourse(courseId: number) {
    // Use teacher-specific endpoint
    this.apiService.getLevelsByCourseForTeacher(courseId).subscribe(
      handleResponse(
        this.loggingService,
        (data: any) => {
          const levels = Array.isArray(data) ? data : [];
          this.levels.update((map) => {
            const newMap = new Map(map);
            newMap.set(courseId, levels);
            return newMap;
          });
          this.processStudentData();
        },
        () => {
          // Error loading levels (403 Forbidden for teachers)
          // Continue without levels - this is expected for teachers
          // Levels will be loaded when viewing progress modal if needed
        }
      )
    );
  }

  processStudentData() {
    const assignments = this.assignments();
    const courses = this.courses();
    const students = this.students();
    const schedules = this.schedules();
    const levelsMap = this.levels();

    const processed: StudentData[] = assignments.map((assignment) => {
      // Get student name
      const student = students.find((s) => s.userId === assignment.studentId);
      const studentName =
        student?.fullName || student?.name || `Student ${assignment.studentId}`;

      // Get course name
      const course = courses.find((c) => c.courseId === assignment.courseId);
      const courseName = course?.courseName || `Course ${assignment.courseId}`;

      // Get current level and progress
      // For now, we'll need to calculate this from progress data or use a placeholder
      // In a real app, you'd fetch progress data for each student
      const courseLevels = levelsMap.get(assignment.courseId) || [];
      const currentLevel =
        courseLevels.length > 0 ? courseLevels[0].levelName : 'Not Started';
      const currentLevelId =
        courseLevels.length > 0 ? courseLevels[0].levelId : undefined;

      // Calculate progress (placeholder - in real app, calculate from completed levels)
      const progress = this.calculateProgress(
        assignment.studentId,
        assignment.courseId,
        courseLevels
      );

      // Get next class date
      const nextClass = this.getNextClassDate(
        assignment.assignmentId,
        schedules
      );
      const nextClassDate = nextClass
        ? new Date(nextClass.scheduledDate || nextClass.date).toISOString()
        : null;

      return {
        assignmentId: assignment.assignmentId,
        studentId: assignment.studentId,
        studentName,
        courseId: assignment.courseId,
        courseName,
        currentLevel,
        currentLevelId,
        progress,
        nextClassDate,
        status: assignment.status || 'ACTIVE',
      };
    });

    this.studentData.set(processed);
  }

  calculateProgress(
    studentId: number,
    courseId: number,
    levels: CourseLevel[]
  ): number {
    // Placeholder calculation
    // In a real app, you'd fetch student progress and calculate based on completed levels
    if (levels.length === 0) return 0;

    // For now, return a random progress (0-100)
    // In production, calculate: (completed levels / total levels) * 100
    return Math.floor(Math.random() * 100);
  }

  getNextClassDate(assignmentId: number, schedules: any[]): any | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingClasses = schedules
      .filter((schedule) => {
        const scheduleDate = new Date(schedule.scheduledDate || schedule.date);
        scheduleDate.setHours(0, 0, 0, 0);
        return (
          schedule.assignmentId === assignmentId &&
          scheduleDate >= today &&
          schedule.status !== 'CANCELLED'
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate || a.date);
        const dateB = new Date(b.scheduledDate || b.date);
        return dateA.getTime() - dateB.getTime();
      });

    return upcomingClasses.length > 0 ? upcomingClasses[0] : null;
  }

  private checkLoadingComplete() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 300);
  }

  onCourseFilterChange(courseId: string) {
    this.selectedCourseId.set(courseId ? parseInt(courseId) : null);
    // Reset level filter when course changes
    this.selectedLevelId.set(null);
  }

  onLevelFilterChange(levelId: string) {
    this.selectedLevelId.set(levelId ? parseInt(levelId) : null);
  }

  viewProgress(student: StudentData) {
    this.showProgressModal.set(true);
    this.loadProgressData(student);
  }

  loadProgressData(student: StudentData) {
    this.isLoadingProgress.set(true);
    const studentId = student.studentId;
    const courseId = student.courseId;

    // Initialize progress data
    const initialProgressData: StudentProgressData = {
      studentId,
      studentName: student.studentName,
      courseId,
      courseName: student.courseName,
      currentLevel: null,
      allLevels: [],
      nextLevel: null,
      progressPercentage: student.progress,
      status: 'in_progress',
      remarks: '',
    };
    this.progressData.set(initialProgressData);

    // Load course levels using teacher endpoint
    this.apiService.getLevelsByCourseForTeacher(courseId).subscribe({
      next: (levels: any) => {
        const sortedLevels = (Array.isArray(levels) ? levels : []).sort(
          (a: any, b: any) => {
            return (a.levelOrder || a.levelId) - (b.levelOrder || b.levelId);
          }
        );

        // Find current level
        const currentLevel =
          sortedLevels.find(
            (l: CourseLevel) => l.levelId === student.currentLevelId
          ) || (sortedLevels.length > 0 ? sortedLevels[0] : null);

        // Find next level
        const currentIndex = currentLevel
          ? sortedLevels.findIndex(
              (l: CourseLevel) => l.levelId === currentLevel.levelId
            )
          : -1;
        const nextLevel =
          currentIndex >= 0 && currentIndex < sortedLevels.length - 1
            ? sortedLevels[currentIndex + 1]
            : null;

        this.progressData.update((data) => {
          if (data) {
            return {
              ...data,
              allLevels: sortedLevels,
              currentLevel: currentLevel,
              nextLevel: nextLevel,
              progressPercentage: student.progress,
            };
          }
          return data;
        });
        this.isLoadingProgress.set(false);
      },
      error: (error: any) => {
        // If 403 Forbidden (teachers can't access admin endpoints)
        // Continue with empty levels - modal will still work but without level details
        this.progressData.update((data) => {
          if (data) {
            return {
              ...data,
              allLevels: [],
              currentLevel: null,
              nextLevel: null,
              progressPercentage: student.progress,
            };
          }
          return data;
        });
        this.isLoadingProgress.set(false);
        // Don't show error for 403 - it's expected for teachers
        if (error?.status !== 403) {
          this.loggingService.onError('Failed to load course levels');
        }
      },
    });
  }

  closeProgressModal() {
    this.showProgressModal.set(false);
    this.progressData.set(null);
    this.progressRemarks.set('');
  }

  markLevelCompleted() {
    const progress = this.progressData();
    if (!progress || !progress.currentLevel) {
      this.loggingService.onError('Missing required information');
      return;
    }

    const remarks = this.progressRemarks().trim();
    this.isLoadingProgress.set(true);

    this.apiService
      .updateStudentLevel(
        progress.studentId,
        progress.courseId,
        progress.currentLevel.levelId,
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
            // Reload progress data and refresh student list
            const student = this.studentData().find(
              (s) =>
                s.studentId === progress.studentId &&
                s.courseId === progress.courseId
            );
            if (student) {
              this.loadProgressData(student);
              // Refresh student data to reflect changes
              this.processStudentData();
            }
            this.progressRemarks.set('');
          },
          () => {
            this.isLoadingProgress.set(false);
          }
        )
      );
  }

  assignNextLevel() {
    const progress = this.progressData();
    if (!progress || !progress.nextLevel) {
      this.loggingService.onError(
        'No next level available or missing information'
      );
      return;
    }

    const remarks = this.progressRemarks().trim();
    this.isLoadingProgress.set(true);

    this.apiService
      .updateStudentLevel(
        progress.studentId,
        progress.courseId,
        progress.nextLevel.levelId,
        'in_progress',
        remarks || undefined
      )
      .subscribe(
        handleResponse(
          this.loggingService,
          (data: any) => {
            this.loggingService.onSuccess('Next level assigned successfully!');
            // Reload progress data and refresh student list
            const student = this.studentData().find(
              (s) =>
                s.studentId === progress.studentId &&
                s.courseId === progress.courseId
            );
            if (student) {
              this.loadProgressData(student);
              // Refresh student data to reflect changes
              this.processStudentData();
            }
            this.progressRemarks.set('');
          },
          () => {
            this.isLoadingProgress.set(false);
          }
        )
      );
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

  assignNextLevelForStudent(student: StudentData) {
    // Open progress modal first, then user can assign next level from there
    this.viewProgress(student);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }
}
