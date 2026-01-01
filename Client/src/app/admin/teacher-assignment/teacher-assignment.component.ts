import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Course {
  courseId: number;
  courseName: string;
  description?: string;
}

interface Teacher {
  userId: number;
  fullName: string;
  email: string;
}

interface TeacherAssignment {
  assignmentId?: number;
  teacherId: number;
  courseId: number;
  teacherName?: string;
  courseName?: string;
  assignedAt?: string;
}

@Component({
  selector: 'app-teacher-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-assignment.component.html',
  styleUrls: ['./teacher-assignment.component.css'],
})
export class TeacherAssignmentComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  courses = signal<Course[]>([]);
  teachers = signal<Teacher[]>([]);
  assignments = signal<TeacherAssignment[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingAssignments = signal<boolean>(false);
  isAssigning = signal<boolean>(false);

  // Form selections
  selectedCourseId = signal<number | null>(null);
  selectedTeacherId = signal<number | null>(null);

  // Computed values
  canAssign = computed(() => {
    return (
      this.selectedCourseId() !== null &&
      this.selectedTeacherId() !== null &&
      !this.isAlreadyAssigned() &&
      this.courses().length > 0
    );
  });

  isAlreadyAssigned = computed(() => {
    const courseId = this.selectedCourseId();
    const teacherId = this.selectedTeacherId();
    if (!courseId || !teacherId) return false;

    return this.assignments().some(
      (a) => a.courseId === courseId && a.teacherId === teacherId
    );
  });

  ngOnInit() {
    console.log('🚀 TeacherAssignmentComponent initialized');
    this.loadData();
  }

  loadData() {
    console.log('🔄 loadData() called');
    this.isLoading.set(true);
    let coursesLoaded = false;
    let teachersLoaded = false;

    const checkAllLoaded = () => {
      console.log('✅ Checking if all data loaded:', {
        coursesLoaded,
        teachersLoaded,
      });
      if (coursesLoaded && teachersLoaded) {
        console.log('✅ All data loaded, setting isLoading to false');
        this.isLoading.set(false);
      }
    };

    // Load courses
    console.log('🌐 Fetching courses from API...');
    this.apiService.getAllCourses().subscribe({
      next: (response: any) => {
        console.log('✅ Courses API response received:', response);
        try {
          // Handle different response structures
          let coursesData = response;
          if (response?.data) {
            coursesData = response.data;
            console.log('📊 Extracted courses from response.data');
          } else if (response?.body) {
            coursesData = response.body;
            console.log('📊 Extracted courses from response.body');
          }

          // Ensure it's an array
          const coursesArray = Array.isArray(coursesData) ? coursesData : [];
          console.log('📋 Courses array:', coursesArray);
          console.log('📋 Courses count:', coursesArray.length);

          this.courses.set(coursesArray);
          console.log('✅ Courses signal set:', this.courses());

          coursesLoaded = true;
          checkAllLoaded();
        } catch (error) {
          console.error('❌ Error processing courses:', error);
          this.courses.set([]);
          this.loggingService.onError('Failed to load courses');
          coursesLoaded = true;
          checkAllLoaded();
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading courses:', error);
        this.courses.set([]);
        this.loggingService.onError(
          'Failed to load courses. Please try again.'
        );
        coursesLoaded = true;
        checkAllLoaded();
      },
    });

    // Load teachers
    this.apiService.getUsersByRole('teacher').subscribe({
      next: (response: any) => {
        try {
          console.log('Raw teachers response:', response);

          // Handle different response structures
          let teachersData = response;
          if (response?.data) {
            teachersData = response.data;
          } else if (response?.body) {
            teachersData = response.body;
          }

          // Ensure it's an array
          const teachersArray = Array.isArray(teachersData) ? teachersData : [];
          console.log('Teachers array:', teachersArray);

          // Filter only approved teachers
          const approvedTeachers = teachersArray.filter((t: any) => {
            const status = (t.status || '').toLowerCase();
            const isApproved = status === 'approved' || status === 'active';
            console.log(
              `Teacher ${
                t.fullName || t.email
              }: status=${status}, approved=${isApproved}`
            );
            return isApproved;
          });

          console.log('Approved teachers:', approvedTeachers);
          this.teachers.set(approvedTeachers);

          // Verify the signal was set correctly
          console.log('Teachers signal after set:', this.teachers());
          console.log(
            'Teachers loaded:',
            approvedTeachers.length,
            'out of',
            teachersArray.length
          );

          // Force change detection by logging each teacher
          approvedTeachers.forEach((teacher, index) => {
            console.log(`Teacher ${index + 1}:`, {
              userId: teacher.userId,
              fullName: teacher.fullName,
              email: teacher.email,
            });
          });

          teachersLoaded = true;
          checkAllLoaded();
        } catch (error) {
          console.error('Error processing teachers:', error);
          this.teachers.set([]);
          this.loggingService.onError('Failed to load teachers');
          teachersLoaded = true;
          checkAllLoaded();
        }
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
        this.teachers.set([]);
        this.loggingService.onError(
          'Failed to load teachers. Please try again.'
        );
        teachersLoaded = true;
        checkAllLoaded();
      },
    });

    // Load existing assignments after a short delay to ensure courses/teachers are loaded
    setTimeout(() => {
      this.loadAssignments();
    }, 100);
  }

  loadAssignments() {
    console.log('🔄 loadAssignments() called');
    this.isLoadingAssignments.set(true);

    // Try to get assignments from API first
    console.log('🌐 Attempting to fetch assignments from API...');
    this.apiService.getAllTeacherAssignments().subscribe({
      next: (response: any) => {
        console.log('✅ API Response received:', response);
        try {
          // Handle different response structures
          let assignmentsData = response;
          if (response?.data) {
            assignmentsData = response.data;
            console.log('📊 Extracted data from response.data');
          } else if (response?.body) {
            assignmentsData = response.body;
            console.log('📊 Extracted data from response.body');
          }

          // Ensure it's an array
          const assignmentsArray = Array.isArray(assignmentsData)
            ? assignmentsData
            : [];
          console.log('📋 Assignments array length:', assignmentsArray.length);

          // Map the response to our interface format
          // The backend now returns TeacherCourseAssignmentDTO with teacherName, courseName, etc.
          const mappedAssignments: TeacherAssignment[] = assignmentsArray.map(
            (assignment: any) => ({
              assignmentId: assignment.assignmentId || assignment.id,
              teacherId: assignment.teacherId || assignment.teacher?.userId,
              courseId: assignment.courseId || assignment.course?.courseId,
              teacherName:
                assignment.teacherName ||
                assignment.teacher?.fullName ||
                assignment.teacher?.name ||
                'Unknown Teacher',
              courseName:
                assignment.courseName ||
                assignment.course?.courseName ||
                assignment.course?.name ||
                'Unknown Course',
              assignedAt:
                assignment.assignedAt ||
                assignment.createdAt ||
                assignment.dateAssigned,
            })
          );

          console.log('✅ Mapped assignments:', mappedAssignments);
          this.assignments.set(mappedAssignments);

          // Save to localStorage for persistence
          this.saveAssignmentsToStorage(mappedAssignments);

          console.log(
            '✅ Assignments loaded from API:',
            mappedAssignments.length
          );
          this.isLoadingAssignments.set(false);
        } catch (error) {
          console.error('❌ Error processing assignments:', error);
          this.loggingService.onError('Failed to process assignments data');
          this.buildAssignmentsFromStorage();
        }
      },
      error: (error: any) => {
        console.log('⚠️ API Error occurred:', error);
        console.log('📝 Error details:', {
          status: error?.status,
          message: error?.message,
          error: error?.error,
        });

        // Check if it's a 404 error (endpoint doesn't exist)
        const errorMessage = error?.message || error?.toString() || '';
        const is404 =
          error?.status === 404 ||
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('No static resource');

        if (is404) {
          // Endpoint doesn't exist - use localStorage assignments
          console.log(
            'ℹ️ Assignments endpoint not available (404), using localStorage assignments'
          );
          this.buildAssignmentsFromStorage();
        } else {
          // Real error - log it but still try localStorage
          console.error('❌ Error loading assignments:', error);
          this.loggingService.onError(
            'Failed to load assignments from server. Using cached data.'
          );
          this.buildAssignmentsFromStorage();
        }
      },
    });
  }

  // Load assignments from localStorage
  private loadAssignmentsFromStorage(): TeacherAssignment[] {
    try {
      const stored = localStorage.getItem('teacherCourseAssignments');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Parsed assignments from localStorage:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
    }
    return [];
  }

  // Save assignments to localStorage
  private saveAssignmentsToStorage(assignments: TeacherAssignment[]) {
    try {
      localStorage.setItem(
        'teacherCourseAssignments',
        JSON.stringify(assignments)
      );
      console.log('💾 Saved assignments to localStorage:', assignments.length);
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }

  // Build assignments from localStorage (fallback when API fails)
  buildAssignmentsFromStorage() {
    console.log('🔄 buildAssignmentsFromStorage() called');
    const savedAssignments = this.loadAssignmentsFromStorage();
    console.log(
      '📦 Retrieved assignments from storage:',
      savedAssignments.length
    );

    // Enrich assignments with current course/teacher names
    const enrichedAssignments = savedAssignments.map((assignment) => {
      const course = this.courses().find(
        (c) => c.courseId === assignment.courseId
      );
      const teacher = this.teachers().find(
        (t) => t.userId === assignment.teacherId
      );

      return {
        ...assignment,
        courseName:
          course?.courseName || assignment.courseName || 'Unknown Course',
        teacherName:
          teacher?.fullName || assignment.teacherName || 'Unknown Teacher',
      };
    });

    console.log('✅ Enriched assignments:', enrichedAssignments);
    this.assignments.set(enrichedAssignments);
    this.isLoadingAssignments.set(false);
  }

  onCourseChange(courseId: string | null) {
    const id = courseId ? parseInt(courseId, 10) : null;
    console.log('Course changed:', id);
    this.selectedCourseId.set(id);
  }

  onTeacherChange(teacherId: string | null) {
    const id = teacherId ? parseInt(teacherId, 10) : null;
    console.log('Teacher changed:', id);
    this.selectedTeacherId.set(id);
  }

  assignTeacher() {
    const courseId = this.selectedCourseId();
    const teacherId = this.selectedTeacherId();

    if (!courseId || !teacherId) {
      this.loggingService.onError('Please select both course and teacher');
      return;
    }

    if (this.isAlreadyAssigned()) {
      this.loggingService.onError(
        'This teacher is already assigned to this course'
      );
      return;
    }

    if (this.courses().length === 0) {
      this.loggingService.onError(
        'At least one course must exist before assignment'
      );
      return;
    }

    this.isAssigning.set(true);

    this.apiService.assignTeacherToCourse(teacherId, courseId).subscribe({
      next: (response: any) => {
        try {
          // Handle different response structures
          let responseData = response;
          if (response?.data) {
            responseData = response.data;
          } else if (response?.body) {
            responseData = response.body;
          }

          this.loggingService.onSuccess(
            'Teacher assigned to course successfully!'
          );

          // Get course and teacher details
          const course = this.courses().find((c) => c.courseId === courseId);
          const teacher = this.teachers().find((t) => t.userId === teacherId);

          // Create new assignment object
          const newAssignment: TeacherAssignment = {
            assignmentId:
              responseData?.assignmentId || responseData?.id || Date.now(),
            teacherId: teacherId,
            courseId: courseId,
            teacherName: teacher?.fullName || 'Unknown',
            courseName: course?.courseName || 'Unknown',
            assignedAt:
              responseData?.assignedAt ||
              responseData?.createdAt ||
              new Date().toISOString(),
          };

          console.log(
            '✅ Assignment created successfully, response:',
            responseData
          );
          console.log('📝 New assignment object:', newAssignment);

          // Add to local assignments list immediately
          this.assignments.update((assignments) => {
            // Check if assignment already exists to avoid duplicates
            const exists = assignments.some(
              (a) => a.teacherId === teacherId && a.courseId === courseId
            );
            if (exists) {
              console.log('⚠️ Assignment already exists, skipping duplicate');
              return assignments;
            }
            const updated = [...assignments, newAssignment];
            console.log('✅ Updated assignments list:', updated);

            // Save to localStorage immediately
            this.saveAssignmentsToStorage(updated);

            return updated;
          });

          // Try to reload assignments from server (if endpoint exists)
          // This ensures we get the actual assignment ID from the database
          setTimeout(() => {
            console.log('🔄 Reloading assignments after creation...');
            this.loadAssignments();
          }, 500);

          // Reset form
          this.selectedCourseId.set(null);
          this.selectedTeacherId.set(null);
          this.isAssigning.set(false);
        } catch (error) {
          console.error('Error processing assignment response:', error);
          this.loggingService.onError(
            'Assignment created but failed to update display'
          );
          this.isAssigning.set(false);
          // Still reload assignments
          this.loadAssignments();
        }
      },
      error: (error: any) => {
        console.error('Error assigning teacher:', error);
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          'Failed to assign teacher. Please try again.';
        this.loggingService.onError(errorMessage);
        this.isAssigning.set(false);
      },
    });
  }

  getCourseName(courseId: number): string {
    const course = this.courses().find((c) => c.courseId === courseId);
    return course?.courseName || 'Unknown';
  }

  getTeacherName(teacherId: number): string {
    const teacher = this.teachers().find((t) => t.userId === teacherId);
    return teacher?.fullName || 'Unknown';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }
}
