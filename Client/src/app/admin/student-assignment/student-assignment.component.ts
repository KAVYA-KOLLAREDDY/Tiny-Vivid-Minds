import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Course {
  courseId: number;
  courseName: string;
}

interface Teacher {
  userId: number;
  fullName: string;
  email: string;
}

interface Student {
  userId: number;
  fullName: string;
  email: string;
}

interface StudentAssignment {
  assignmentId?: number;
  studentId: number;
  teacherId: number;
  courseId: number;
  startDate?: string;
  endDate?: string;
  preferredTime?: string;
  timezone?: 'US' | 'Indian';
  durationMinutes?: number;
  status?: string;
  studentName?: string;
  teacherName?: string;
  courseName?: string;
}

interface TeacherCourseAssignment {
  assignmentId: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  courseId: number;
  courseName: string;
  assignedAt: string;
}

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-assignment.component.html',
  styleUrls: ['./student-assignment.component.css']
})
export class StudentAssignmentComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  courses = signal<Course[]>([]);
  teachers = signal<Teacher[]>([]);
  teacherCourseAssignments = signal<TeacherCourseAssignment[]>([]);
  students = signal<Student[]>([]);
  assignments = signal<StudentAssignment[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingAssignments = signal<boolean>(false);
  isAssigning = signal<boolean>(false);
  isReassigning = signal<boolean>(false);

  // Modal states
  showReassignModal = signal<boolean>(false);
  selectedAssignmentForReassign = signal<StudentAssignment | null>(null);

  // Form selections
  selectedCourseId = signal<number | null>(null);
  selectedTeacherId = signal<number | null>(null);
  selectedStudentIds = signal<number[]>([]);
  preferredTime = signal<string>('');
  timezone = signal<'US' | 'Indian'>('US');
  durationMinutes = signal<number>(60); // Default 60 minutes
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Computed signal for teachers filtered by selected course
  filteredTeachers = computed(() => {
    const selectedCourseId = this.selectedCourseId();
    if (!selectedCourseId) {
      return this.teachers(); // Return all teachers if no course selected
    }

    const assignedTeacherIds = this.teacherCourseAssignments()
      .filter(assignment => assignment.courseId === selectedCourseId)
      .map(assignment => assignment.teacherId);

    return this.teachers().filter(teacher => assignedTeacherIds.includes(teacher.userId));
  });

  // Get today's date in YYYY-MM-DD format for date inputs
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get minimum date for end date input
  getMinEndDate(): string {
    return this.startDate() || this.getTodayDate();
  }

  // Computed values
  canAssign = computed(() => {
    return this.selectedCourseId() !== null &&
           this.selectedTeacherId() !== null &&
           this.selectedStudentIds().length > 0 &&
           this.preferredTime().trim() !== '' &&
           this.startDate().trim() !== '' &&
           this.durationMinutes() > 0 &&
           !this.hasAssignmentConflicts();
  });

  hasAssignmentConflicts = computed(() => {
    const courseId = this.selectedCourseId();
    const teacherId = this.selectedTeacherId();
    const studentIds = this.selectedStudentIds();
    const startDate = this.startDate();
    const endDate = this.endDate();
    const preferredTime = this.preferredTime();
    const duration = this.durationMinutes();

    if (!courseId || !teacherId || studentIds.length === 0 || !startDate) return false;

    // Check for teacher scheduling conflicts
    if (this.hasTeacherSchedulingConflict(teacherId, startDate, endDate, preferredTime, duration)) {
      return true;
    }

    // Check for student scheduling conflicts with existing assignments
    return studentIds.some(studentId => {
      return this.hasSchedulingConflict(studentId, startDate, endDate, preferredTime, duration);
    });
  });

  hasTeacherConflict = computed(() => {
    const teacherId = this.selectedTeacherId();
    const startDate = this.startDate();
    const endDate = this.endDate();
    const preferredTime = this.preferredTime();
    const duration = this.durationMinutes();

    if (!teacherId || !startDate) return false;

    return this.hasTeacherSchedulingConflict(teacherId, startDate, endDate, preferredTime, duration);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    let coursesLoaded = false;
    let teachersLoaded = false;
    let teacherCourseAssignmentsLoaded = false;
    let studentsLoaded = false;

    const checkAllLoaded = () => {
      if (coursesLoaded && teachersLoaded && teacherCourseAssignmentsLoaded && studentsLoaded) {
        this.isLoading.set(false);
      }
    };
    
    // Load courses
    this.apiService.getAllCourses().subscribe({
      next: (response: any) => {
        try {
          let coursesData = response;
          if (response?.data) {
            coursesData = response.data;
          } else if (response?.body) {
            coursesData = response.body;
          }
          const coursesArray = Array.isArray(coursesData) ? coursesData : [];
          this.courses.set(coursesArray);
          console.log('Courses loaded:', coursesArray.length);
          coursesLoaded = true;
          checkAllLoaded();
        } catch (error) {
          console.error('Error processing courses:', error);
          this.courses.set([]);
          this.loggingService.onError('Failed to load courses');
          coursesLoaded = true;
          checkAllLoaded();
        }
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
        this.courses.set([]);
        this.loggingService.onError('Failed to load courses. Please try again.');
        coursesLoaded = true;
        checkAllLoaded();
      }
    });

    // Load teachers
    this.apiService.getUsersByRole('teacher').subscribe({
      next: (response: any) => {
        try {
          let teachersData = response;
          if (response?.data) {
            teachersData = response.data;
          } else if (response?.body) {
            teachersData = response.body;
          }
          const teachersArray = Array.isArray(teachersData) ? teachersData : [];
          const approvedTeachers = teachersArray.filter((t: any) => {
            const status = (t.status || '').toLowerCase();
            return status === 'approved' || status === 'active';
          });
          this.teachers.set(approvedTeachers);
          console.log('Teachers loaded:', approvedTeachers.length, 'out of', teachersArray.length);
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
        this.loggingService.onError('Failed to load teachers. Please try again.');
        teachersLoaded = true;
        checkAllLoaded();
      }
    });

    // Load teacher-course assignments
    this.apiService.getAllTeacherAssignments().subscribe({
      next: (response: any) => {
        try {
          let assignmentsData = response;
          if (response?.data) {
            assignmentsData = response.data;
          } else if (response?.body) {
            assignmentsData = response.body;
          }
          const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
          this.teacherCourseAssignments.set(assignmentsArray);
          console.log('Teacher-course assignments loaded:', assignmentsArray.length);
          teacherCourseAssignmentsLoaded = true;
          checkAllLoaded();
        } catch (error) {
          console.error('Error processing teacher-course assignments:', error);
          this.teacherCourseAssignments.set([]);
          this.loggingService.onError('Failed to load teacher-course assignments');
          teacherCourseAssignmentsLoaded = true;
          checkAllLoaded();
        }
      },
      error: (error: any) => {
        console.error('Error loading teacher-course assignments:', error);
        this.teacherCourseAssignments.set([]);
        this.loggingService.onError('Failed to load teacher-course assignments. Please try again.');
        teacherCourseAssignmentsLoaded = true;
        checkAllLoaded();
      }
    });

    // Load students
    this.apiService.getUsersByRole('student').subscribe({
      next: (response: any) => {
        try {
          let studentsData = response;
          if (response?.data) {
            studentsData = response.data;
          } else if (response?.body) {
            studentsData = response.body;
          }
          const studentsArray = Array.isArray(studentsData) ? studentsData : [];
          const approvedStudents = studentsArray.filter((s: any) => {
            const status = (s.status || '').toLowerCase();
            return status === 'approved' || status === 'active';
          });
          this.students.set(approvedStudents);
          console.log('Students loaded:', approvedStudents.length, 'out of', studentsArray.length);
          studentsLoaded = true;
          checkAllLoaded();
        } catch (error) {
          console.error('Error processing students:', error);
          this.students.set([]);
          this.loggingService.onError('Failed to load students');
          studentsLoaded = true;
          checkAllLoaded();
        }
      },
      error: (error: any) => {
        console.error('Error loading students:', error);
        this.students.set([]);
        this.loggingService.onError('Failed to load students. Please try again.');
        studentsLoaded = true;
        checkAllLoaded();
      }
    });

    // Load existing assignments
    setTimeout(() => {
      this.loadAssignments();
    }, 100);
  }

  loadAssignments() {
    console.log('🔄 loadAssignments() called');
    this.isLoadingAssignments.set(true);
    
    // Fetch assignments from API
    console.log('🌐 Attempting to fetch student assignments from API...');
    this.apiService.getAllStudentAssignments().subscribe({
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
          const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
          console.log('📋 Assignments array length:', assignmentsArray.length);
          
          // Map the response to our interface format
          const mappedAssignments: StudentAssignment[] = assignmentsArray.map((assignment: any) => {
            // Get names from loaded data
            const course = this.courses().find(c => c.courseId === assignment.courseId);
            const teacher = this.teachers().find(t => t.userId === assignment.teacherId);
            const student = this.students().find(s => s.userId === assignment.studentId);
            
            return {
              assignmentId: assignment.assignmentId || assignment.id,
              studentId: assignment.studentId || assignment.student?.userId,
              teacherId: assignment.teacherId || assignment.teacher?.userId,
              courseId: assignment.courseId || assignment.course?.courseId,
              startDate: assignment.startDate || assignment.start_date,
              endDate: assignment.endDate || assignment.end_date,
              preferredTime: assignment.preferredTime || assignment.preferred_time,
              timezone: assignment.timezone || 'US',
              durationMinutes: assignment.durationMinutes || assignment.duration_minutes || 60,
              status: assignment.status || 'active',
              studentName: student?.fullName || assignment.student?.fullName || 'Unknown Student',
              teacherName: teacher?.fullName || assignment.teacher?.fullName || 'Unknown Teacher',
              courseName: course?.courseName || assignment.course?.courseName || 'Unknown Course'
            };
          });
          
          console.log('✅ Mapped assignments:', mappedAssignments);
          this.assignments.set(mappedAssignments);
          console.log('✅ Assignments loaded from API:', mappedAssignments.length);
          this.isLoadingAssignments.set(false);
        } catch (error) {
          console.error('❌ Error processing assignments:', error);
          this.loggingService.onError('Failed to process assignments data');
          this.assignments.set([]);
          this.isLoadingAssignments.set(false);
        }
      },
      error: (error: any) => {
        console.log('⚠️ API Error occurred:', error);
        console.log('📝 Error details:', {
          status: error?.status,
          message: error?.message,
          error: error?.error
        });
        
        // Check if it's a 404 error (endpoint doesn't exist)
        const errorMessage = error?.message || error?.toString() || '';
        const is404 = error?.status === 404 || 
                     errorMessage.includes('404') || 
                     errorMessage.includes('Not Found') ||
                     errorMessage.includes('No static resource');
        
        if (is404) {
          console.log('ℹ️ Assignments endpoint not available (404), assignments table will be empty');
          this.assignments.set([]);
        } else {
          console.error('❌ Error loading assignments:', error);
          this.loggingService.onError('Failed to load assignments from server.');
          this.assignments.set([]);
        }
        this.isLoadingAssignments.set(false);
      }
    });
  }

  onCourseChange(courseId: string | null) {
    this.selectedCourseId.set(courseId ? parseInt(courseId, 10) : null);
    // Clear selected teacher and students when course changes
    // since the teacher might not be assigned to the new course
    this.selectedTeacherId.set(null);
    this.selectedStudentIds.set([]);
  }

  onTeacherChange(teacherId: string | null) {
    this.selectedTeacherId.set(teacherId ? parseInt(teacherId, 10) : null);
  }

  onStudentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions);
    const studentIds = selectedOptions.map(option => parseInt(option.value));
    this.selectedStudentIds.set(studentIds);
  }

  onTimeChange(time: string) {
    this.preferredTime.set(time);
  }

  onTimezoneChange(timezone: string) {
    this.timezone.set(timezone as 'US' | 'Indian');
  }

  onStartDateChange(date: string) {
    this.startDate.set(date);
    // If end date is before start date, clear it
    if (this.endDate() && date && this.endDate() < date) {
      this.endDate.set('');
    }
  }

  onEndDateChange(date: string) {
    this.endDate.set(date);
  }

  onDurationChange(duration: string) {
    const durationNum = parseInt(duration, 10);
    if (!isNaN(durationNum) && durationNum > 0) {
      this.durationMinutes.set(durationNum);
    }
  }

  isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds().includes(studentId);
  }

  isStudentAlreadyAssigned(studentId: number): boolean {
    const courseId = this.selectedCourseId();
    if (!courseId) return false;

    return this.assignments().some(a =>
      a.studentId === studentId && a.courseId === courseId
    );
  }

  hasSchedulingConflictForStudent(studentId: number): boolean {
    const startDate = this.startDate();
    const endDate = this.endDate();
    const preferredTime = this.preferredTime();
    const duration = this.durationMinutes();

    if (!startDate) return false;

    return this.hasSchedulingConflict(studentId, startDate, endDate, preferredTime, duration);
  }

  openReassignModal(assignment: StudentAssignment) {
    this.selectedAssignmentForReassign.set(assignment);
    this.selectedTeacherId.set(null); // Reset teacher selection
    this.showReassignModal.set(true);
  }

  closeReassignModal() {
    this.showReassignModal.set(false);
    this.selectedAssignmentForReassign.set(null);
    this.selectedTeacherId.set(null);
  }

  reassignStudent() {
    const assignment = this.selectedAssignmentForReassign();
    const newTeacherId = this.selectedTeacherId();

    if (!assignment || !newTeacherId) {
      this.loggingService.onError('Please select a teacher');
      return;
    }

    // Don't allow reassigning to the same teacher
    if (assignment.teacherId === newTeacherId) {
      this.loggingService.onError('Student is already assigned to this teacher');
      return;
    }

    this.isReassigning.set(true);

    // For now, we'll delete the old assignment and create a new one
    // In a real implementation, you might have a dedicated reassignment API
    const reassignmentData = {
      studentId: assignment.studentId,
      teacherId: newTeacherId,
      courseId: assignment.courseId,
      preferredTime: assignment.preferredTime,
      timezone: assignment.timezone,
      durationMinutes: assignment.durationMinutes,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      status: assignment.status
    };

    this.apiService.assignStudentToTeacher(reassignmentData).subscribe({
      next: (data: any) => {
        this.loggingService.onSuccess('Student reassigned successfully!');

        // Update the assignment in the local list
        const updatedAssignment: StudentAssignment = {
          ...assignment,
          teacherId: newTeacherId,
          teacherName: this.getTeacherName(newTeacherId),
          assignmentId: data?.assignmentId
        };

        this.assignments.update(assignments =>
          assignments.map(a =>
            a.assignmentId === assignment.assignmentId ? updatedAssignment : a
          )
        );

        this.closeReassignModal();
        this.isReassigning.set(false);
      },
      error: (error: any) => {
        console.error('Error reassigning student:', error);
        this.loggingService.onError('Failed to reassign student. Please try again.');
        this.isReassigning.set(false);
      }
    });
  }

  // Check for scheduling conflicts when assigning to multiple courses
  hasSchedulingConflict(studentId: number, newStartDate: string, newEndDate?: string, newPreferredTime?: string, newDuration?: number): boolean {
    const studentAssignments = this.assignments().filter(a => a.studentId === studentId && a.status === 'active');

    // Check each existing assignment for time conflicts
    return studentAssignments.some(assignment => {
      // Skip if this is the same course (for reassignments)
      if (this.selectedCourseId() && assignment.courseId === this.selectedCourseId()) {
        return false;
      }

      // Simple conflict detection - if dates overlap and times are close
      const existingStart = new Date(assignment.startDate || '');
      const existingEnd = assignment.endDate ? new Date(assignment.endDate) : null;
      const newStart = new Date(newStartDate);
      const newEnd = newEndDate ? new Date(newEndDate) : null;

      // If date ranges overlap
      if ((existingEnd && newStart <= existingEnd) || (!existingEnd && newStart >= existingStart) ||
          (newEnd && existingStart <= newEnd) || (!newEnd && existingStart <= newStart)) {

        // Check if times are too close (within 2 hours)
        if (assignment.preferredTime && newPreferredTime) {
          const existingTime = this.parseTime(assignment.preferredTime);
          const newTime = this.parseTime(newPreferredTime);

          if (Math.abs(existingTime - newTime) < 120) { // 2 hours in minutes
            return true;
          }
        }
      }

      return false;
    });
  }

  parseTime(timeString: string): number {
    // Convert time string (HH:MM or HH:MM:SS) to minutes since midnight
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }

  // Check for teacher scheduling conflicts - prevent assigning when teacher already has a course at the same time/day
  hasTeacherSchedulingConflict(teacherId: number, newStartDate: string, newEndDate?: string, newPreferredTime?: string, newDuration?: number): boolean {
    const teacherAssignments = this.assignments().filter(a => a.teacherId === teacherId && a.status === 'active');

    return teacherAssignments.some(assignment => {
      // Skip if this is the same course (for reassignments)
      if (this.selectedCourseId() && assignment.courseId === this.selectedCourseId()) {
        return false;
      }

      // Check date overlap
      const existingStart = new Date(assignment.startDate || '');
      const existingEnd = assignment.endDate ? new Date(assignment.endDate) : null;
      const newStart = new Date(newStartDate);
      const newEnd = newEndDate ? new Date(newEndDate) : null;

      // If date ranges overlap
      if ((existingEnd && newStart <= existingEnd) || (!existingEnd && newStart >= existingStart) ||
          (newEnd && existingStart <= newEnd) || (!newEnd && existingStart <= newStart)) {

        // Check if times are too close (within 2 hours) - same logic as student conflicts
        if (assignment.preferredTime && newPreferredTime) {
          const existingTime = this.parseTime(assignment.preferredTime);
          const newTime = this.parseTime(newPreferredTime);

          if (Math.abs(existingTime - newTime) < 120) { // 2 hours in minutes
            return true;
          }
        }
      }

      return false;
    });
  }

  assignStudents() {
    const courseId = this.selectedCourseId();
    const teacherId = this.selectedTeacherId();
    const studentIds = this.selectedStudentIds();
    const time = this.preferredTime().trim();
    const startDate = this.startDate().trim();
    const endDate = this.endDate().trim();
    const duration = this.durationMinutes();

    if (!courseId || !teacherId || studentIds.length === 0 || !time || !startDate || duration <= 0) {
      this.loggingService.onError('Please fill in all required fields');
      return;
    }

    // Validate date range
    if (endDate && startDate && endDate < startDate) {
      this.loggingService.onError('End date must be after start date');
      return;
    }

    if (this.hasAssignmentConflicts()) {
      // Check for teacher conflicts first
      if (this.hasTeacherSchedulingConflict(teacherId, startDate, endDate, time, duration)) {
        this.loggingService.onError('The selected teacher already has a course scheduled at this time. Please choose a different time or teacher.');
        return;
      }
      // Otherwise it's student conflicts
      this.loggingService.onError('One or more selected students have scheduling conflicts with their existing assignments');
      return;
    }

    this.isAssigning.set(true);

    // Convert time to 24-hour format for API
    const time24 = this.convertTo24Hour(time);
    const selectedTimezone = this.timezone();

    // Assign each student
    const assignments = studentIds.map(studentId => {
      const assignmentData: any = {
        studentId: studentId,
        teacherId: teacherId,
        courseId: courseId,
        preferredTime: time24,
        timezone: selectedTimezone,
        durationMinutes: duration,
        startDate: startDate,
        status: 'active'
      };

      // Add endDate only if provided
      if (endDate) {
        assignmentData.endDate = endDate;
      }

      return this.apiService.assignStudentToTeacher(assignmentData).toPromise();
    });

    // Wait for all assignments to complete
    Promise.all(assignments).then((results: any[]) => {
      this.loggingService.onSuccess(`Successfully assigned ${studentIds.length} student(s) to teacher!`);
      
      // Add to local assignments list
      results.forEach((data: any, index) => {
        const studentId = studentIds[index];
        const course = this.courses().find(c => c.courseId === courseId);
        const teacher = this.teachers().find(t => t.userId === teacherId);
        const student = this.students().find(s => s.userId === studentId);
        
        const newAssignment: StudentAssignment = {
          assignmentId: data?.assignmentId,
          studentId: studentId,
          teacherId: teacherId,
          courseId: courseId,
          preferredTime: time,
          timezone: selectedTimezone,
          durationMinutes: duration,
          status: 'active',
          studentName: student?.fullName || 'Unknown',
          teacherName: teacher?.fullName || 'Unknown',
          courseName: course?.courseName || 'Unknown',
          startDate: startDate,
          endDate: endDate || undefined
        };

        this.assignments.update(assignments => [...assignments, newAssignment]);
      });
      
      // Reset form
      this.selectedCourseId.set(null);
      this.selectedTeacherId.set(null);
      this.selectedStudentIds.set([]);
      this.preferredTime.set('');
      this.timezone.set('US');
      this.durationMinutes.set(60);
      this.startDate.set('');
      this.endDate.set('');
      this.isAssigning.set(false);
      
      // Reload assignments from server to get the latest data
      setTimeout(() => {
        console.log('🔄 Reloading assignments after creation...');
        this.loadAssignments();
      }, 500);
    }).catch(() => {
      this.isAssigning.set(false);
    });
  }

  convertTo24Hour(time: string): string {
    // Time input already returns 24-hour format (HH:MM)
    // Just ensure it has seconds
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length === 2) {
        return `${parts[0]}:${parts[1]}:00`;
      }
    }
    return time;
  }

  getTimezoneInfo(): { name: string; offset: string; abbreviation: string } {
    if (this.timezone() === 'US') {
      return {
        name: 'US Eastern Time',
        offset: 'EST/EDT',
        abbreviation: 'ET'
      };
    } else {
      return {
        name: 'Indian Standard Time',
        offset: 'IST',
        abbreviation: 'IST'
      };
    }
  }

  formatTimeWithTimezone(time: string): string {
    if (!time) return 'N/A';
    const formatted = this.formatTime(time);
    const tzInfo = this.getTimezoneInfo();
    return `${formatted} (${tzInfo.abbreviation})`;
  }

  formatTime(time?: string): string {
    if (!time) return 'N/A';
    try {
      // If already in 12-hour format, return as is
      if (time.includes('AM') || time.includes('PM')) {
        return time;
      }
      // Convert 24-hour to 12-hour format (HH:MM:SS or HH:MM)
      const timePart = time.split(':');
      const hour24 = parseInt(timePart[0]);
      const minutes = timePart[1] || '00';
      const hour12 = hour24 % 12 || 12;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${period}`;
    } catch {
      return time;
    }
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-unknown';
    const s = status.toLowerCase();
    if (s === 'active') return 'status-active';
    if (s === 'completed') return 'status-completed';
    if (s === 'paused') return 'status-paused';
    return 'status-unknown';
  }

  getStatusDisplay(status?: string): string {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getCourseName(courseId: number): string {
    const course = this.courses().find(c => c.courseId === courseId);
    return course?.courseName || 'Unknown';
  }

  getTeacherName(teacherId: number): string {
    const teacher = this.teachers().find(t => t.userId === teacherId);
    return teacher?.fullName || 'Unknown';
  }

  getStudentName(studentId: number): string {
    const student = this.students().find(s => s.userId === studentId);
    return student?.fullName || 'Unknown';
  }

  formatDate(dateString?: string): string {
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

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      }
    }
  }
}

