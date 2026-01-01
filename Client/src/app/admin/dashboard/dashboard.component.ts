import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

interface KPICard {
  title: string;
  value: number;
  icon: string;
  gradient: string;
  change?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Data signals
  totalStudents = signal<number>(0);
  totalTeachers = signal<number>(0);
  totalCourses = signal<number>(0);
  isLoading = signal<boolean>(true);

  // KPI Cards
  kpiCards = computed<KPICard[]>(() => [
    {
      title: 'Total Students',
      value: this.totalStudents(),
      icon: 'fas fa-user-graduate',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Total Teachers',
      value: this.totalTeachers(),
      icon: 'fas fa-chalkboard-teacher',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Total Courses',
      value: this.totalCourses(),
      icon: 'fas fa-book',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Load users by role
    this.apiService.getUsersByRole('student').subscribe({
      next: (students: any) => {
        this.totalStudents.set(Array.isArray(students) ? students.length : 0);
        this.checkLoadingComplete();
      },
      error: () => {
        this.totalStudents.set(0);
        this.checkLoadingComplete();
      }
    });

    this.apiService.getUsersByRole('teacher').subscribe({
      next: (teachers: any) => {
        this.totalTeachers.set(Array.isArray(teachers) ? teachers.length : 0);
        this.checkLoadingComplete();
      },
      error: () => {
        this.totalTeachers.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load courses
    this.apiService.getAllCourses().subscribe({
      next: (courses: any) => {
        this.totalCourses.set(Array.isArray(courses) ? courses.length : 0);
        this.checkLoadingComplete();
      },
      error: () => {
        this.totalCourses.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load calendar events from demo bookings
    this.apiService.getAllDemoBookings().subscribe({
      next: (bookings: any) => {
        const allBookings = Array.isArray(bookings) ? bookings : [];
        this.loadCalendarEvents(allBookings);
        this.checkLoadingComplete();
      },
      error: () => {
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    // Simple check - in a real app, you'd track individual API calls
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  private loadCalendarEvents(bookings: any[]): void {
    const events: EventInput[] = bookings
      .filter((booking: any) => booking.date && booking.status !== 'CANCELLED')
      .map((booking: any) => ({
        title: `Demo: ${booking.name || 'Demo Booking'}`,
        start: booking.date,
        backgroundColor: this.getEventColor(booking.status),
        borderColor: this.getEventColor(booking.status),
      }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };
  }

  private getEventColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  }

  navigateToProfile(): void {
    // Navigate to profile page (to be implemented)
    this.router.navigate(['/admin/profile']);
  }
}

