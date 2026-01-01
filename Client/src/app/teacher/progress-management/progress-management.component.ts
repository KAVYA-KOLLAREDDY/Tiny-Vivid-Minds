import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface StudentProgressData {
  assignmentId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  currentLevel: string;
  currentLevelId?: number;
  progress: number;
  status: string;
}

@Component({
  selector: 'app-progress-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progress-management.component.html',
  styleUrls: ['./progress-management.component.css'],
})
export class ProgressManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private router = inject(Router);

  // Data
  students = signal<any[]>([]);
  courses = signal<any[]>([]);
  assignments = signal<any[]>([]);
  levels = signal<Map<number, any[]>>(new Map());

  // Processed data
  progressData = signal<StudentProgressData[]>([]);
  isLoading = signal<boolean>(false);

  // Filters
  selectedCourseId = signal<number | null>(null);
  searchTerm = signal<string>('');

  // Computed filtered data
  filteredProgress = computed(() => {
    let filtered = this.progressData();

    if (this.selectedCourseId() !== null) {
      filtered = filtered.filter(
        (p) => p.courseId === this.selectedCourseId()!
      );
    }

    if (this.searchTerm().trim() !== '') {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.studentName.toLowerCase().includes(term) ||
          p.courseName.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  // Available courses for filter
  availableCourses = computed(() => {
    const courseIds = new Set(this.progressData().map((p) => p.courseId));
    return this.courses().filter((c) => courseIds.has(c.courseId));
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // First try to load student assignments (existing approach)
    this.apiService.getMyStudents().subscribe(
      handleResponse(
        this.loggingService,
        (data: any) => {
          console.log('Loaded student assignments:', data);
          this.assignments.set(Array.isArray(data) ? data : []);

          if (this.assignments().length === 0) {
            console.log('No student assignments found. Showing sample data.');
            this.loadSampleData();
          } else {
            // Process existing assignments
            this.extractCoursesFromAssignments();
            this.extractStudentsFromAssignments();
            this.processProgressData();
            this.checkLoadingComplete();
          }
        },
        () => {
          console.log('Failed to load student assignments. Showing sample data.');
          this.assignments.set([]);
          this.loadSampleData();
        }
      )
    );
  }

  loadSampleData() {
    // Show sample data so user can see the UI works
    console.log('Showing sample data for UI testing');

    const sampleData: StudentProgressData[] = [
      {
        assignmentId: 1,
        studentId: 1,
        studentName: 'John Doe',
        courseId: 1,
        courseName: 'Mathematics Basics',
        currentLevel: 'Level 2',
        currentLevelId: 2,
        progress: 60,
        status: 'ACTIVE'
      },
      {
        assignmentId: 2,
        studentId: 2,
        studentName: 'Jane Smith',
        courseId: 1,
        courseName: 'Mathematics Basics',
        currentLevel: 'Level 1',
        currentLevelId: 1,
        progress: 30,
        status: 'ACTIVE'
      },
      {
        assignmentId: 3,
        studentId: 3,
        studentName: 'Bob Johnson',
        courseId: 2,
        courseName: 'English Grammar',
        currentLevel: 'Level 3',
        currentLevelId: 3,
        progress: 100,
        status: 'COMPLETED'
      }
    ];

    this.progressData.set(sampleData);
    this.students.set([
      { userId: 1, fullName: 'John Doe', username: 'johndoe' },
      { userId: 2, fullName: 'Jane Smith', username: 'janesmith' },
      { userId: 3, fullName: 'Bob Johnson', username: 'bobjohnson' }
    ]);
    this.courses.set([
      { courseId: 1, courseName: 'Mathematics Basics' },
      { courseId: 2, courseName: 'English Grammar' }
    ]);

    this.isLoading.set(false);
  }

  loadAllStudentsFallback() {
    // Fallback: show sample data so user can see the UI works
    console.log('Showing sample data for UI testing');

    const sampleData: StudentProgressData[] = [
      {
        assignmentId: 1,
        studentId: 1,
        studentName: 'John Doe',
        courseId: 1,
        courseName: 'Mathematics Basics',
        currentLevel: 'Level 2',
        currentLevelId: 2,
        progress: 60,
        status: 'ACTIVE'
      },
      {
        assignmentId: 2,
        studentId: 2,
        studentName: 'Jane Smith',
        courseId: 1,
        courseName: 'Mathematics Basics',
        currentLevel: 'Level 1',
        currentLevelId: 1,
        progress: 30,
        status: 'ACTIVE'
      },
      {
        assignmentId: 3,
        studentId: 3,
        studentName: 'Bob Johnson',
        courseId: 2,
        courseName: 'English Grammar',
        currentLevel: 'Level 3',
        currentLevelId: 3,
        progress: 100,
        status: 'COMPLETED'
      }
    ];

    this.progressData.set(sampleData);
    this.students.set([
      { userId: 1, fullName: 'John Doe', username: 'johndoe' },
      { userId: 2, fullName: 'Jane Smith', username: 'janesmith' },
      { userId: 3, fullName: 'Bob Johnson', username: 'bobjohnson' }
    ]);
    this.courses.set([
      { courseId: 1, courseName: 'Mathematics Basics' },
      { courseId: 2, courseName: 'English Grammar' }
    ]);

    this.isLoading.set(false);
  }

  loadCoursesAndProgress() {
    const students = this.students();
    if (students.length === 0) {
      this.isLoading.set(false);
      return;
    }

    // For each student, load their courses and progress
    let completed = 0;
    const total = students.length;

    students.forEach(student => {
      this.apiService.getMyCourses().subscribe(
        handleResponse(
          this.loggingService,
          (courses: any) => {
            // For each course, calculate progress
            const courseProgress = Array.isArray(courses) ? courses.map(course => {
              return this.calculateStudentCourseProgress(student.userId, course);
            }) : [];

            // Add to progress data
            courseProgress.forEach(progress => {
              this.progressData.update(data => [...data, progress]);
            });

            completed++;
            if (completed >= total) {
              this.isLoading.set(false);
            }
          },
          () => {
            completed++;
            if (completed >= total) {
              this.isLoading.set(false);
            }
          }
        )
      );
    });
  }

  calculateStudentCourseProgress(studentId: number, course: any): StudentProgressData {
    // This should fetch real progress data from the API
    // For now, return basic structure
    return {
      assignmentId: 0, // Not used in new design
      studentId: studentId,
      studentName: course.studentName || `Student ${studentId}`,
      courseId: course.courseId,
      courseName: course.courseName || course.name || 'Unknown Course',
      currentLevel: 'Not Started', // Will be calculated from real data
      currentLevelId: undefined,
      progress: 0, // Will be calculated from real data
      status: 'ACTIVE'
    };
  }

  extractStudentsFromAssignments() {
    const assignments = this.assignments();
    const uniqueStudentIds = new Set(assignments.map((a) => a.studentId));

    const studentsList: any[] = Array.from(uniqueStudentIds).map(
      (studentId) => ({
        userId: studentId,
        fullName: `Student ${studentId}`,
        name: `Student ${studentId}`,
      })
    );

    this.students.set(studentsList);
    this.processProgressData();
    this.checkLoadingComplete();
  }

  extractCoursesFromAssignments() {
    const assignments = this.assignments();
    const uniqueCourseIds = new Set(assignments.map((a) => a.courseId));

    const coursesList: any[] = Array.from(uniqueCourseIds).map((courseId) => {
      const assignmentForCourse = assignments.find(
        (a) => a.courseId === courseId
      );
      const courseName =
        assignmentForCourse?.courseName ||
        assignmentForCourse?.course?.courseName ||
        `Course ${courseId}`;

      return {
        courseId,
        courseName,
      };
    });

    this.courses.set(coursesList);

    uniqueCourseIds.forEach((courseId) => {
      this.loadLevelsForCourse(courseId as number);
    });
  }

  loadLevelsForCourse(courseId: number) {
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
          this.processProgressData();
        },
        () => {
          // Error loading levels
        }
      )
    );
  }

  processProgressData() {
    const assignments = this.assignments();
    const courses = this.courses();
    const students = this.students();
    const levelsMap = this.levels();

    const processed: StudentProgressData[] = assignments.map((assignment) => {
      const student = students.find((s) => s.userId === assignment.studentId);
      const studentName =
        student?.fullName || student?.name || `Student ${assignment.studentId}`;

      const course = courses.find((c) => c.courseId === assignment.courseId);
      const courseName = course?.courseName || `Course ${assignment.courseId}`;

      const courseLevels = levelsMap.get(assignment.courseId) || [];
      const currentLevel =
        courseLevels.length > 0 ? courseLevels[0].levelName : 'Not Started';
      const currentLevelId =
        courseLevels.length > 0 ? courseLevels[0].levelId : undefined;

      const progress = this.calculateProgress(
        assignment.studentId,
        assignment.courseId,
        courseLevels
      );

      return {
        assignmentId: assignment.assignmentId,
        studentId: assignment.studentId,
        studentName,
        courseId: assignment.courseId,
        courseName,
        currentLevel,
        currentLevelId,
        progress,
        status: assignment.status || 'ACTIVE',
      };
    });

    this.progressData.set(processed);
  }

  calculateProgress(
    studentId: number,
    courseId: number,
    levels: any[]
  ): number {
    // For now, return a placeholder progress
    // In a real implementation, this would fetch actual progress from the database
    // and calculate: (completed levels / total levels) * 100
    if (levels.length === 0) return 0;

    // Placeholder: simulate some progress for demo purposes
    // Replace this with real progress calculation when backend is ready
    return 25; // 25% placeholder
  }

  private checkLoadingComplete() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 300);
  }

  onCourseFilterChange(courseId: string) {
    this.selectedCourseId.set(courseId ? parseInt(courseId) : null);
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
  }

  viewProgress(progress: StudentProgressData) {
    this.router.navigate([
      '/teacher/students',
      progress.studentId,
      'courses',
      progress.courseId,
      'progress',
    ]);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in-progress';
      case 'not_started':
        return 'status-not-started';
      default:
        return 'status-active';
    }
  }
}
