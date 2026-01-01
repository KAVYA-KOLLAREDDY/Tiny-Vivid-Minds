import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface KPICard {
  title: string;
  value: number;
  icon: string;
  gradient: string;
}

interface TodayClass {
  id: number;
  studentName: string;
  courseName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private loggingService = inject(LoggingService);

  // Data signals
  totalStudents = signal<number>(0);
  upcomingClassesCount = signal<number>(0);
  totalCourses = signal<number>(0);
  pendingEvaluations = signal<number>(0);
  todayClasses = signal<TodayClass[]>([]);
  isLoading = signal<boolean>(true);
  calendarEvents = signal<EventInput[]>([]);

  // KPI Cards
  kpiCards = computed<KPICard[]>(() => [
    {
      title: 'My Students',
      value: this.totalStudents(),
      icon: 'fas fa-user-graduate',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Upcoming Classes',
      value: this.upcomingClassesCount(),
      icon: 'fas fa-calendar-check',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Courses',
      value: this.totalCourses(),
      icon: 'fas fa-book',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Pending Evaluations',
      value: this.pendingEvaluations(),
      icon: 'fas fa-clipboard-check',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ]);

  // Calendar options
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: [],
    height: 'auto',
    eventColor: '#6366f1',
    eventTextColor: '#ffffff',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    eventClick: (info) => {
      // Handle event click if needed
      console.log('Event clicked:', info.event);
    },
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Load students
    this.apiService.getMyStudents().subscribe(
      handleResponse(this.loggingService, (students: any) => {
        const studentsList = Array.isArray(students) ? students : [];
        this.totalStudents.set(studentsList.length);
        
        // Get unique courses from student assignments
        const uniqueCourses = new Set(
          studentsList
            .map((s: any) => s.courseName || s.course?.name)
            .filter((name: any) => name)
        );
        this.totalCourses.set(uniqueCourses.size);
        
        this.checkLoadingComplete();
      }, () => {
        this.totalStudents.set(0);
        this.totalCourses.set(0);
        this.checkLoadingComplete();
      })
    );

    // Load calendar data
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1); // Get data from last month
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2); // Get data up to 2 months ahead

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    this.apiService.getMyCalendar(start, end).subscribe(
      handleResponse(this.loggingService, (schedules: any) => {
        const schedulesList = Array.isArray(schedules) ? schedules : [];
        
        // Filter upcoming classes (from today onwards)
        const upcoming = schedulesList.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.scheduledDate || schedule.date);
          return scheduleDate >= today && schedule.status !== 'CANCELLED';
        });
        this.upcomingClassesCount.set(upcoming.length);

        // Filter today's classes
        const todayStr = today.toISOString().split('T')[0];
        const todayClassesList = schedulesList
          .filter((schedule: any) => {
            const scheduleDate = new Date(schedule.scheduledDate || schedule.date);
            const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
            return scheduleDateStr === todayStr && schedule.status !== 'CANCELLED';
          })
          .map((schedule: any) => ({
            id: schedule.classId || schedule.id,
            studentName: schedule.studentName || schedule.student?.name || 'Unknown',
            courseName: schedule.courseName || schedule.course?.name || 'Unknown',
            scheduledDate: schedule.scheduledDate || schedule.date,
            scheduledTime: schedule.scheduledTime || schedule.time || 'TBD',
            status: schedule.status || 'SCHEDULED',
          }));
        this.todayClasses.set(todayClassesList);

        // Load calendar events
        this.loadCalendarEvents(schedulesList);
        
        // Calculate pending evaluations (schedules that need evaluation)
        const pending = schedulesList.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.scheduledDate || schedule.date);
          return scheduleDate < today && 
                 schedule.status === 'COMPLETED' && 
                 !schedule.evaluated;
        });
        this.pendingEvaluations.set(pending.length);
        
        this.checkLoadingComplete();
      }, () => {
        this.upcomingClassesCount.set(0);
        this.todayClasses.set([]);
        this.pendingEvaluations.set(0);
        this.checkLoadingComplete();
      })
    );
  }

  private checkLoadingComplete(): void {
    // Simple check - in a real app, you'd track individual API calls
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  private loadCalendarEvents(schedules: any[]): void {
    const events: EventInput[] = schedules
      .filter((schedule: any) => schedule.scheduledDate && schedule.status !== 'CANCELLED')
      .map((schedule: any) => {
        const date = new Date(schedule.scheduledDate || schedule.date);
        const time = schedule.scheduledTime || schedule.time || '';
        const title = `${schedule.studentName || schedule.student?.name || 'Class'}: ${schedule.courseName || schedule.course?.name || ''}`;
        
        return {
          title: title,
          start: date.toISOString().split('T')[0],
          backgroundColor: this.getEventColor(schedule.status),
          borderColor: this.getEventColor(schedule.status),
          extendedProps: {
            time: time,
            studentName: schedule.studentName || schedule.student?.name,
            courseName: schedule.courseName || schedule.course?.name,
          },
        };
      });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };
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

  viewDetails(): void {
    // Navigate to calendar or students page
    this.router.navigate(['/teacher/students']);
  }

  getStatusClass(status: string): string {
    return `status-${status?.toLowerCase() || 'scheduled'}`;
  }

  formatTime(time: string): string {
    if (!time) return 'TBD';
    // If time is in HH:mm format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    // Otherwise try to parse and format
    return time;
  }
}

