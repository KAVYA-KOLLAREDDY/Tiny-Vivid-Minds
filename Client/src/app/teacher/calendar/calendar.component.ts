import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FullCalendarModule,
  FullCalendarComponent,
} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface ClassDetails {
  classId: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  topic: string;
  status: string;
  levelId?: number;
  levelName?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  classDetails: ClassDetails;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  @ViewChild('fullCalendar') fullCalendar!: FullCalendarComponent;

  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  isLoading = signal<boolean>(false);
  schedules = signal<any[]>([]);
  assignments = signal<any[]>([]);
  studentsMap = signal<Map<number, any>>(new Map());
  coursesMap = signal<Map<number, any>>(new Map());
  selectedClass = signal<ClassDetails | null>(null);
  showSidePanel = signal<boolean>(false);
  selectedDateClasses = signal<ClassDetails[]>([]);
  currentView = signal<'month' | 'week' | 'day'>('week');
  selectedDate = signal<Date>(new Date());
  // Edit timing state
  isEditingClass = signal<boolean>(false);
  editDate = signal<string>('');
  editTime = signal<string>('');
  editDuration = signal<number | null>(null);
  editError = signal<string>('');
  isSavingEdit = signal<boolean>(false);

  // Computed events for the selected date
  eventsForSelectedDate = computed(() => {
    const date = this.selectedDate();
    const schedules = this.schedules();
    const assignments = this.assignments();

    return schedules
      .filter((schedule: any) => {
        if (!schedule.scheduledDate || schedule.status === 'CANCELLED')
          return false;
        const scheduleDate = new Date(schedule.scheduledDate);
        scheduleDate.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === compareDate.getTime();
      })
      .map((schedule: any) => {
        const assignment = assignments.find(
          (a) => a.assignmentId === schedule.assignmentId
        );

        // Get student information with fallbacks
        const studentId = assignment?.studentId || schedule.studentId;
        const student =
          this.studentsMap().get(studentId) ||
          assignment?.student ||
          schedule.student;
        const studentName =
          schedule.studentName ||
          assignment?.studentName ||
          student?.fullName ||
          student?.name ||
          assignment?.student?.fullName ||
          assignment?.student?.name ||
          schedule.student?.fullName ||
          schedule.student?.name ||
          `Student ${studentId || 'Unknown'}`;

        // Get course information with fallbacks
        const courseId = assignment?.courseId || schedule.courseId;
        const course =
          this.coursesMap().get(courseId) ||
          assignment?.course ||
          schedule.course;
        const courseName =
          schedule.courseName ||
          assignment?.courseName ||
          course?.courseName ||
          assignment?.course?.courseName ||
          schedule.course?.courseName ||
          `Course ${courseId || 'Unknown'}`;

        const scheduledDate = new Date(schedule.scheduledDate);

        // Get duration from schedule or assignment (default 60 minutes)
        const durationMinutes =
          schedule.durationMinutes ||
          schedule.duration_minutes ||
          assignment?.durationMinutes ||
          assignment?.duration_minutes ||
          60;

        const endDate = new Date(scheduledDate);
        endDate.setMinutes(endDate.getMinutes() + durationMinutes);

        return {
          classId: schedule.classId,
          assignmentId: schedule.assignmentId,
          studentId: studentId,
          studentName: studentName,
          courseId: courseId,
          courseName: courseName,
          scheduledDate: schedule.scheduledDate,
          scheduledTime: this.formatTime(scheduledDate),
          duration: durationMinutes,
          topic: schedule.topic || 'No topic',
          status: schedule.status || 'SCHEDULED',
          levelId: schedule.levelId,
          levelName: schedule.levelName || schedule.level?.levelName,
        } as ClassDetails;
      })
      .sort((a, b) => {
        const timeA = new Date(a.scheduledDate).getTime();
        const timeB = new Date(b.scheduledDate).getTime();
        return timeA - timeB;
      });
  });

  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    timeZone: 'local',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: [],
    height: 'auto',
    eventColor: '#6366f1',
    eventTextColor: '#ffffff',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    editable: false,
    selectable: true,
    selectMirror: true,
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    allDaySlot: false,
    eventClick: (info) => this.onEventClick(info),
    dateClick: (info: any) => this.onDateClick(info),
    datesSet: (info) => this.onDatesSet(info),
  };

  ngOnInit(): void {
    this.loadCalendarData();

    // Refresh calendar data every 5 minutes to keep it up-to-date
    setInterval(() => {
      if (!this.isLoading()) {
        this.refreshCalendar();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  refreshCalendar(): void {
    // Reload calendar data without showing loading state
    this.loadSchedules();
  }

  loadCalendarData(): void {
    this.isLoading.set(true);

    // Load assignments to get student and course names
    this.apiService.getMyStudents().subscribe({
      next: (data: any) => {
        const assignmentsArray = Array.isArray(data) ? data : [];

        // Map assignments to include names if available
        const mappedAssignments = assignmentsArray.map((assignment: any) => {
          const studentId = assignment.studentId || assignment.student?.userId;
          const courseId = assignment.courseId || assignment.course?.courseId;

          // Extract student info
          const studentName =
            assignment.studentName ||
            assignment.student?.fullName ||
            assignment.student?.name;

          // Extract course info
          const courseName =
            assignment.courseName || assignment.course?.courseName;

          // Build students and courses maps for quick lookup
          if (studentId) {
            this.studentsMap.update((map) => {
              const newMap = new Map(map);
              if (!newMap.has(studentId)) {
                newMap.set(studentId, {
                  userId: studentId,
                  fullName: studentName || `Student ${studentId}`,
                  email: assignment.student?.email || '',
                });
              }
              return newMap;
            });
          }

          if (courseId) {
            this.coursesMap.update((map) => {
              const newMap = new Map(map);
              if (!newMap.has(courseId)) {
                newMap.set(courseId, {
                  courseId: courseId,
                  courseName: courseName || `Course ${courseId}`,
                });
              }
              return newMap;
            });
          }

          return {
            assignmentId: assignment.assignmentId || assignment.id,
            studentId: studentId,
            teacherId: assignment.teacherId || assignment.teacher?.userId,
            courseId: courseId,
            startDate: assignment.startDate || assignment.start_date,
            preferredTime:
              assignment.preferredTime || assignment.preferred_time,
            durationMinutes:
              assignment.durationMinutes || assignment.duration_minutes || 60,
            status: assignment.status || 'ACTIVE',
            studentName: studentName,
            courseName: courseName,
            student: assignment.student,
            course: assignment.course,
          };
        });

        this.assignments.set(mappedAssignments);

        // Course names should already be available from assignment data
        // No need to fetch from admin endpoint (which teachers can't access)

        this.loadSchedules();
      },
      error: () => {
        this.assignments.set([]);
        this.loadSchedules();
      },
    });
  }

  // Removed enrichCourseNames() - teachers don't have access to admin endpoints
  // Course names should be available from assignment data

  loadSchedules(): void {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 2); // 2 months back
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 6); // 6 months ahead

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    this.apiService.getMyCalendar(start, end).subscribe({
      next: (schedules: any) => {
        const schedulesList = Array.isArray(schedules) ? schedules : [];

        // Process and enrich schedule data
        const enrichedSchedules = schedulesList.map((schedule: any) => {
          // Find matching assignment to enrich with student/course data
          const assignment = this.assignments().find(
            (a) => a.assignmentId === schedule.assignmentId
          );

          return {
            ...schedule,
            // Add student info if available
            studentId: assignment?.studentId || schedule.studentId,
            studentName:
              assignment?.studentName ||
              assignment?.student?.fullName ||
              schedule.studentName,
            // Add course info if available
            courseId: assignment?.courseId || schedule.courseId,
            courseName:
              assignment?.courseName ||
              assignment?.course?.courseName ||
              schedule.courseName,
          };
        });

        this.schedules.set(enrichedSchedules);

        // If no schedules exist, create events from assignments
        if (enrichedSchedules.length === 0) {
          this.createEventsFromAssignments();
        } else {
          this.loadCalendarEvents(enrichedSchedules);
        }

        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.log(
          'No schedules found or error loading schedules, creating from assignments'
        );
        // If schedules endpoint fails or returns empty, create events from assignments
        this.createEventsFromAssignments();
        this.schedules.set([]);
        this.isLoading.set(false);
      },
    });
  }

  createEventsFromAssignments(): void {
    const assignments = this.assignments();
    const events: EventInput[] = [];

    assignments.forEach((assignment: any) => {
      if (!assignment.startDate || !assignment.preferredTime) {
        return; // Skip assignments without required data
      }

      // Get student and course information
      const studentId = assignment.studentId;
      const student = this.studentsMap().get(studentId) || assignment?.student;
      const studentName =
        assignment.studentName ||
        student?.fullName ||
        student?.name ||
        assignment?.student?.fullName ||
        assignment?.student?.name ||
        `Student ${studentId || 'Unknown'}`;

      const courseId = assignment.courseId;
      const course = this.coursesMap().get(courseId) || assignment?.course;
      const courseName =
        assignment.courseName ||
        course?.courseName ||
        assignment?.course?.courseName ||
        `Course ${courseId || 'Unknown'}`;

      // Parse start date and preferred time
      const startDateStr = assignment.startDate;
      const timeStr = assignment.preferredTime;

      if (!startDateStr || !timeStr) {
        return; // Skip if missing required data
      }

      // Create date from startDate and preferredTime
      const [year, month, day] = startDateStr.split('-').map(Number);
      const timeParts = timeStr.split(':');
      const hours = parseInt(timeParts[0]) || 0;
      const minutes = parseInt(timeParts[1]) || 0;

      const classDateTime = new Date(year, month - 1, day, hours, minutes, 0);

      // Validate the date
      if (isNaN(classDateTime.getTime())) {
        console.warn('Invalid date for assignment:', assignment);
        return;
      }

      // Show events from the start date onwards (up to 6 months ahead, matching loadSchedules range)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const classDate = new Date(classDateTime);
      classDate.setHours(0, 0, 0, 0);

      // Show events from start date if it's today or in the future, up to 6 months ahead
      // Also show events from 2 months back (matching loadSchedules range)
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      if (classDate < twoMonthsAgo || classDate > sixMonthsFromNow) {
        return; // Skip dates outside the calendar range
      }

      // Get duration from assignment (default 60 minutes)
      const durationMinutes =
        assignment.durationMinutes || assignment.duration_minutes || 60;

      // Calculate end time using duration from assignment
      const endDateTime = new Date(classDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      const formattedTime = this.formatTime(classDateTime);
      const title = studentName; // Show student name as the main title

      events.push({
        id: `assignment-${assignment.assignmentId}-${classDateTime.getTime()}`,
        title: title,
        start: this.formatLocalDateTime(classDateTime),
        end: this.formatLocalDateTime(endDateTime),
        backgroundColor: '#3b82f6', // Blue for scheduled
        borderColor: '#2563eb',
        textColor: '#ffffff',
        extendedProps: {
          classId: null,
          assignmentId: assignment.assignmentId,
          studentId: studentId,
          studentName: studentName,
          courseId: courseId,
          courseName: courseName,
          scheduledDate: this.formatLocalDateTime(classDateTime),
          scheduledTime: formattedTime,
          duration: durationMinutes,
          topic: 'Regular Class',
          status: 'SCHEDULED',
          levelId: null,
          levelName: null,
          isFromAssignment: true, // Flag to indicate this is from assignment, not schedule
        },
      } as EventInput);
    });

    // Update calendar with events (same approach as loadCalendarEvents)
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };

    console.log(
      `Created ${events.length} events from ${assignments.length} assignments`
    );
  }

  private loadCalendarEvents(schedules: any[]): void {
    const assignments = this.assignments();

    // Create a map for quick lookup
    const assignmentMap = new Map(assignments.map((a) => [a.assignmentId, a]));

    // Filter and validate schedules first
    const validSchedules = schedules.filter((schedule: any) => {
      // Filter out cancelled and invalid schedules
      if (!schedule.scheduledDate || schedule.status === 'CANCELLED') {
        return false;
      }
      // Validate date
      const date = new Date(schedule.scheduledDate);
      return !isNaN(date.getTime());
    });

    // Map valid schedules to events
    const events: EventInput[] = validSchedules.map((schedule: any) => {
      // Find assignment by assignmentId
      const assignment = assignmentMap.get(schedule.assignmentId);

      // Get student information from multiple sources
      const studentId = assignment?.studentId || schedule.studentId;
      const student =
        this.studentsMap().get(studentId) ||
        assignment?.student ||
        schedule.student;
      const studentName =
        schedule.studentName ||
        assignment?.studentName ||
        student?.fullName ||
        student?.name ||
        assignment?.student?.fullName ||
        assignment?.student?.name ||
        schedule.student?.fullName ||
        schedule.student?.name ||
        `Student ${studentId || 'Unknown'}`;

      // Get course information from multiple sources
      const courseId = assignment?.courseId || schedule.courseId;
      const course =
        this.coursesMap().get(courseId) ||
        assignment?.course ||
        schedule.course;
      const courseName =
        schedule.courseName ||
        assignment?.courseName ||
        course?.courseName ||
        assignment?.course?.courseName ||
        schedule.course?.courseName ||
        `Course ${courseId || 'Unknown'}`;

      // Parse scheduled date (already validated in filter)
      const scheduledDate = new Date(schedule.scheduledDate);

      // Get duration from schedule or assignment (default 60 minutes)
      const durationMinutes =
        schedule.durationMinutes ||
        schedule.duration_minutes ||
        assignment?.durationMinutes ||
        assignment?.duration_minutes ||
        60;

      // Calculate end time using duration
      const endDate = new Date(scheduledDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      const timeStr = this.formatTime(scheduledDate);
      const title = studentName; // Show student name as the main title

      return {
        id:
          schedule.classId?.toString() ||
          `schedule-${schedule.assignmentId}-${scheduledDate.getTime()}`,
        title: title,
        start: this.formatLocalDateTime(scheduledDate),
        end: this.formatLocalDateTime(endDate),
        backgroundColor: this.getEventColor(schedule.status),
        borderColor: this.getEventColor(schedule.status),
        textColor: '#ffffff',
        extendedProps: {
          classId: schedule.classId,
          assignmentId: schedule.assignmentId,
          studentId: studentId,
          studentName: studentName,
          courseId: courseId,
          courseName: courseName,
          scheduledDate: schedule.scheduledDate,
          scheduledTime: timeStr,
          duration: durationMinutes,
          topic: schedule.topic || 'No topic',
          status: schedule.status || 'SCHEDULED',
          levelId: schedule.levelId,
          levelName: schedule.levelName || schedule.level?.levelName,
        },
      } as EventInput;
    });

    // Update calendar with new events
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };
  }

  onEventClick(info: EventClickArg): void {
    const extendedProps = info.event.extendedProps as any;
    const classDetails: ClassDetails = {
      classId: extendedProps.classId,
      assignmentId: extendedProps.assignmentId,
      studentId: extendedProps.studentId,
      studentName: extendedProps.studentName,
      courseId: extendedProps.courseId,
      courseName: extendedProps.courseName,
      scheduledDate: extendedProps.scheduledDate,
      scheduledTime: extendedProps.scheduledTime,
      duration: extendedProps.duration || 60,
      topic: extendedProps.topic || 'No topic',
      status: extendedProps.status || 'SCHEDULED',
      levelId: extendedProps.levelId,
      levelName: extendedProps.levelName,
    };
    this.selectedClass.set(classDetails);
    this.showSidePanel.set(true);
    this.isEditingClass.set(false);
  }

  onDateClick(info: any): void {
    const clickedDate = new Date(info.dateStr);
    this.selectedDate.set(clickedDate);
    this.showSidePanel.set(true);
  }

  onDatesSet(info: any): void {
    // Update selected date when calendar view changes
    if (info.view.type === 'timeGridDay') {
      this.selectedDate.set(info.start);
    }

    // Optionally refresh data when navigating to a different date range
    // This ensures we have data for the visible range
    const visibleStart = new Date(info.start);
    const visibleEnd = new Date(info.end);
    const currentStart = new Date();
    currentStart.setMonth(currentStart.getMonth() - 2);
    const currentEnd = new Date();
    currentEnd.setMonth(currentEnd.getMonth() + 6);

    // If user navigated outside our loaded range, reload
    if (visibleStart < currentStart || visibleEnd > currentEnd) {
      this.loadSchedules();
    }
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.selectedClass.set(null);
    this.isEditingClass.set(false);
  }

  selectEvent(event: ClassDetails): void {
    this.selectedClass.set(event);
    this.showSidePanel.set(true);
  }

  changeView(view: 'month' | 'week' | 'day'): void {
    this.currentView.set(view);
    const viewMap: Record<string, string> = {
      month: 'dayGridMonth',
      week: 'timeGridWeek',
      day: 'timeGridDay',
    };

    if (this.fullCalendar?.getApi()) {
      const calendarApi = this.fullCalendar.getApi();
      calendarApi.changeView(viewMap[view] as any);
    } else {
      this.calendarOptions = {
        ...this.calendarOptions,
        initialView: viewMap[view] as any,
      };
    }
  }

  goToToday(): void {
    const today = new Date();
    this.selectedDate.set(today);

    if (this.fullCalendar?.getApi()) {
      const calendarApi = this.fullCalendar.getApi();
      calendarApi.today();
      // Refresh data when navigating to today
      this.refreshCalendar();
    } else {
      this.calendarOptions = {
        ...this.calendarOptions,
        initialDate: today,
      };
    }
  }

  // Method to manually refresh calendar data
  onRefresh(): void {
    this.isLoading.set(true);
    this.loadCalendarData();
  }

  private getEventColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return '#10b981';
      case 'SCHEDULED':
        return '#6366f1';
      case 'CANCELLED':
        return '#ef4444';
      case 'PENDING':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  }

  private formatLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    // Local datetime string without timezone (treated as local by FullCalendar)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hour12}:${minutesStr} ${period}`;
  }

  formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${
          hours > 1 ? 's' : ''
        } ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      }
    }
  }

  getStatusClass(status: string): string {
    return `status-${status?.toLowerCase() || 'scheduled'}`;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  formatDateHeader(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  // ---- Edit class timing (teacher) ----

  startEditSelectedClass(): void {
    const cls = this.selectedClass();
    if (!cls) {
      this.editError.set('No class selected.');
      return;
    }

    try {
      const dateObj = new Date(cls.scheduledDate);
      if (isNaN(dateObj.getTime())) {
        this.editError.set('Invalid current class date/time.');
        return;
      }

      const dateStr = dateObj.toISOString().split('T')[0];
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const mins = dateObj.getMinutes().toString().padStart(2, '0');

      this.editDate.set(dateStr);
      this.editTime.set(`${hours}:${mins}`);
      this.editDuration.set(cls.duration || 60);
      this.editError.set('');
      this.isEditingClass.set(true);
    } catch (e) {
      console.error('Error initializing edit state', e);
      this.editError.set('Unable to start edit for this class.');
    }
  }

  cancelEditSelectedClass(): void {
    this.isEditingClass.set(false);
    this.editError.set('');
  }

  onEditDateChange(value: string): void {
    this.editDate.set(value);
  }

  onEditTimeChange(value: string): void {
    this.editTime.set(value);
  }

  onEditDurationChange(value: string): void {
    const num = Number(value);
    this.editDuration.set(isNaN(num) ? null : num);
  }

  saveEditedClassTiming(): void {
    const cls = this.selectedClass();
    if (!cls) {
      this.editError.set('This class cannot be edited.');
      return;
    }

    const dateStr = this.editDate();
    const timeStr = this.editTime();
    const duration = this.editDuration() ?? cls.duration ?? 60;

    if (!dateStr || !timeStr) {
      this.editError.set('Please select both date and time.');
      return;
    }

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      const newDate = new Date(
        year,
        (month || 1) - 1,
        day || 1,
        hour || 0,
        minute || 0,
        0
      );

      if (isNaN(newDate.getTime())) {
        this.editError.set('Invalid date or time.');
        return;
      }

      this.isSavingEdit.set(true);
      this.editError.set('');

      // Build local datetime string (no timezone) so backend and calendar treat it as local time
      const scheduledDateStr = `${dateStr}T${timeStr}:00`;

      // Prepare payload for (re)creating schedule
      const createPayload: any = {
        assignmentId: cls.assignmentId,
        scheduledDate: scheduledDateStr,
        durationMinutes: duration,
        // Flags so admin can see this was changed by teacher
        teacherUpdated: true,
        updatedBy: 'TEACHER',
      };

      const createNewSchedule = () => {
        this.apiService.createSchedule(createPayload).subscribe({
          next: () => {
            this.isEditingClass.set(false);
            this.isSavingEdit.set(false);
            // Reload schedules so new class appears and admin also sees it
            this.loadSchedules();
          },
          error: (error: any) => {
            console.error(
              'Failed to create class schedule from assignment',
              error
            );
            this.isSavingEdit.set(false);
            this.editError.set(
              'Failed to create class timing. Please try again.'
            );
          },
        });
      };

      if (cls.classId) {
        // Mark old schedule as cancelled, then create a new one with updated timing
        this.apiService
          .updateScheduleStatus(cls.classId, 'CANCELLED')
          .subscribe({
            next: () => {
              createNewSchedule();
            },
            error: (error: any) => {
              console.error('Failed to cancel previous class schedule', error);
              this.isSavingEdit.set(false);
              this.editError.set(
                'Failed to cancel previous class timing. Please try again.'
              );
            },
          });
      } else if (cls.assignmentId) {
        // No existing schedule, create a new one directly
        createNewSchedule();
      } else {
        this.isSavingEdit.set(false);
        this.editError.set(
          'This class does not have assignment information to schedule.'
        );
      }
    } catch (e) {
      console.error('Error while saving edited class timing', e);
      this.editError.set('Unexpected error while updating class timing.');
      this.isSavingEdit.set(false);
    }
  }
}
