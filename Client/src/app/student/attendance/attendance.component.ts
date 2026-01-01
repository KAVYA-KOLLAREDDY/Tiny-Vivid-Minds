import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface AttendanceRecord {
  attendanceId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  teacherId: number;
  teacherName: string;
  classDate: string;
  status: 'Present' | 'Absent' | 'Rescheduled';
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  attendanceStatus?: 'Present' | 'Absent' | 'Rescheduled';
  attendanceRecord?: AttendanceRecord;
}

interface Course {
  courseId: number;
  courseName: string;
}

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class StudentAttendanceComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  currentDate = signal<Date>(new Date());
  calendarDays = signal<CalendarDay[]>([]);
  attendanceRecords = signal<AttendanceRecord[]>([]);
  courses = signal<Course[]>([]);
  selectedCourseId = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  selectedDate = signal<Date | null>(null);
  selectedAttendance = signal<AttendanceRecord | null>(null);
  showDetailsModal = signal<boolean>(false);

  // Computed values
  attendancePercentage = computed(() => {
    const records = this.attendanceRecords();
    if (records.length === 0) return 0;

    const presentCount = records.filter((r) => r.status === 'Present').length;
    const totalClasses = records.filter(
      (r) => r.status !== 'Rescheduled'
    ).length;

    return totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0;
  });

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  filteredAttendance = computed(() => {
    const courseId = this.selectedCourseId();
    if (!courseId) return this.attendanceRecords();
    return this.attendanceRecords().filter((a) => a.courseId === courseId);
  });

  stats = computed(() => {
    const records = this.filteredAttendance();
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const rescheduled = records.filter(
      (r) => r.status === 'Rescheduled'
    ).length;
    const total = records.length;

    return { present, absent, rescheduled, total };
  });

  ngOnInit(): void {
    this.loadCourses();
    this.loadAttendanceData();
  }

  loadCourses(): void {
    this.apiService.getMyCourses().subscribe(
      handleResponse(
        this.loggingService,
        (courses: any) => {
          const coursesList = Array.isArray(courses) ? courses : [];
          this.courses.set(
            coursesList.map((c: any) => ({
              courseId: c.courseId,
              courseName: c.courseName || c.name || 'Unknown Course',
            }))
          );
        },
        () => {
          this.courses.set([]);
        }
      )
    );
  }

  loadAttendanceData(): void {
    this.isLoading.set(true);

    // Get current month's date range
    const date = this.currentDate();
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Format dates for API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Load attendance data for the current month
    this.apiService
      .getMyAttendanceByDateRange(startDateStr, endDateStr)
      .subscribe(
        handleResponse(
          this.loggingService,
          (attendance: any) => {
            const records = Array.isArray(attendance) ? attendance : [];
            this.attendanceRecords.set(
              records.map((a: any) => ({
                attendanceId: a.attendanceId,
                studentId: a.studentId,
                studentName: a.studentName,
                courseId: a.courseId,
                courseName: a.courseName,
                teacherId: a.teacherId,
                teacherName: a.teacherName,
                classDate: a.classDate,
                status: a.status,
                remarks: a.remarks,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
              }))
            );
            this.generateCalendar();
            this.isLoading.set(false);
          },
          () => {
            // If date range fails, try loading all attendance
            this.apiService.getMyAttendance().subscribe(
              handleResponse(
                this.loggingService,
                (attendance: any) => {
                  const records = Array.isArray(attendance) ? attendance : [];
                  this.attendanceRecords.set(
                    records.map((a: any) => ({
                      attendanceId: a.attendanceId,
                      studentId: a.studentId,
                      studentName: a.studentName,
                      courseId: a.courseId,
                      courseName: a.courseName,
                      teacherId: a.teacherId,
                      teacherName: a.teacherName,
                      classDate: a.classDate,
                      status: a.status,
                      remarks: a.remarks,
                      createdAt: a.createdAt,
                      updatedAt: a.updatedAt,
                    }))
                  );
                  this.generateCalendar();
                  this.isLoading.set(false);
                },
                () => {
                  this.attendanceRecords.set([]);
                  this.generateCalendar();
                  this.isLoading.set(false);
                }
              )
            );
          }
        )
      );
  }

  generateCalendar(): void {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days in the month
    const daysInMonth = lastDay.getDate();

    // Day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const startingDayOfWeek = firstDay.getDay();

    // Adjust to start from Monday (1) instead of Sunday (0)
    const adjustedStartingDay =
      startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month to fill the first week
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = adjustedStartingDay - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date: dayDate,
        day: dayDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dateStr = dayDate.toISOString().split('T')[0];
      const attendance = this.attendanceRecords().find((a) => {
        const recordDate = new Date(a.classDate);
        recordDate.setHours(0, 0, 0, 0);
        return this.isSameDay(recordDate, dayDate);
      });

      days.push({
        date: dayDate,
        day: day,
        isCurrentMonth: true,
        isToday: this.isSameDay(dayDate, today),
        attendanceStatus: attendance?.status,
        attendanceRecord: attendance,
      });
    }

    // Add days from next month to fill the last week (total 42 days for 6 weeks)
    const totalDays = days.length;
    const remainingDays = 42 - totalDays;

    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        day: dayDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    this.calendarDays.set(days);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  previousMonth(): void {
    const date = this.currentDate();
    date.setMonth(date.getMonth() - 1);
    this.currentDate.set(new Date(date));
    this.loadAttendanceData();
  }

  nextMonth(): void {
    const date = this.currentDate();
    date.setMonth(date.getMonth() + 1);
    this.currentDate.set(new Date(date));
    this.loadAttendanceData();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.loadAttendanceData();
  }

  onCourseFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const courseId = target.value ? parseInt(target.value) : null;
    this.selectedCourseId.set(courseId);
    this.generateCalendar();
  }

  openDetailsModal(day: CalendarDay): void {
    if (day.attendanceRecord) {
      this.selectedAttendance.set(day.attendanceRecord);
      this.selectedDate.set(day.date);
      this.showDetailsModal.set(true);
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedAttendance.set(null);
    this.selectedDate.set(null);
  }

  getAttendanceClass(status?: 'Present' | 'Absent' | 'Rescheduled'): string {
    if (!status) return '';
    switch (status) {
      case 'Present':
        return 'attendance-present';
      case 'Absent':
        return 'attendance-absent';
      case 'Rescheduled':
        return 'attendance-rescheduled';
      default:
        return '';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }
}
