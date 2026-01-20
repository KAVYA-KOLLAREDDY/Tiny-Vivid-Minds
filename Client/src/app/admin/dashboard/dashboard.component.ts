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
  type: 'students' | 'teachers' | 'courses' | 'demo_pending' | 'contact_pending' | 'feedback_pending';
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
  pendingDemoBookings = signal<number>(0);
  pendingContacts = signal<number>(0);
  pendingFeedbacks = signal<number>(0);
  isLoading = signal<boolean>(true);

  // View mode signals
  currentViewMode = signal<'calendar' | 'table'>('calendar');
  selectedTableType = signal<string>('');

  // Detailed data signals for tables
  detailedStudents = signal<any[]>([]);
  detailedTeachers = signal<any[]>([]);
  detailedCourses = signal<any[]>([]);
  detailedDemoBookings = signal<any[]>([]);
  detailedContacts = signal<any[]>([]);
  detailedFeedbacks = signal<any[]>([]);

  // KPI Cards
  kpiCards = computed<KPICard[]>(() => [
    {
      title: 'Total Students',
      value: this.totalStudents(),
      icon: 'fas fa-user-graduate',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      type: 'students',
    },
    {
      title: 'Total Teachers',
      value: this.totalTeachers(),
      icon: 'fas fa-chalkboard-teacher',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      type: 'teachers',
    },
    {
      title: 'Total Courses',
      value: this.totalCourses(),
      icon: 'fas fa-book',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      type: 'courses',
    },
    {
      title: 'Total Demo Pending Requests',
      value: this.pendingDemoBookings(),
      icon: 'fas fa-calendar-plus',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      type: 'demo_pending',
    },
    {
      title: 'Total Pending Contact Us Requests',
      value: this.pendingContacts(),
      icon: 'fas fa-envelope-open-text',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      type: 'contact_pending',
    },
    {
      title: 'Total Pending Feedback Requests',
      value: this.pendingFeedbacks(),
      icon: 'fas fa-comments',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      type: 'feedback_pending',
    },
  ]);

  // Calendar options
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'refreshButton dayGridMonth,dayGridWeek'
    },
    customButtons: {
      refreshButton: {
        text: '🔄 Refresh',
        click: this.refreshCalendarEvents.bind(this)
      }
    },
    events: [],
    height: 'auto',
    eventColor: '#6366f1',
    eventTextColor: '#ffffff',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    datesSet: this.handleDateChange.bind(this), // Dynamic loading when dates change
  };

  ngOnInit(): void {
    console.log('🎯 DashboardComponent: ngOnInit called');
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    console.log('📊 DashboardComponent: Starting to load dashboard data');
    this.isLoading.set(true);

    // Load users by role
    console.log('👨‍🎓 DashboardComponent: Loading students');
    this.apiService.getUsersByRole('student').subscribe({
      next: (students: any) => {
        console.log('✅ DashboardComponent: Students loaded successfully', students);
        this.totalStudents.set(Array.isArray(students) ? students.length : 0);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading students', error);
        this.totalStudents.set(0);
        this.checkLoadingComplete();
      }
    });

    console.log('👨‍🏫 DashboardComponent: Loading teachers');
    this.apiService.getUsersByRole('teacher').subscribe({
      next: (teachers: any) => {
        console.log('✅ DashboardComponent: Teachers loaded successfully', teachers);
        this.totalTeachers.set(Array.isArray(teachers) ? teachers.length : 0);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading teachers', error);
        this.totalTeachers.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load courses
    console.log('📚 DashboardComponent: Loading courses');
    this.apiService.getAllCourses().subscribe({
      next: (courses: any) => {
        console.log('✅ DashboardComponent: Courses loaded successfully', courses);
        this.totalCourses.set(Array.isArray(courses) ? courses.length : 0);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading courses', error);
        this.totalCourses.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load demo bookings for calendar and pending count
    console.log('📅 DashboardComponent: Loading demo bookings');
    this.apiService.getAllDemoBookings().subscribe({
      next: (bookings: any) => {
        console.log('✅ DashboardComponent: Demo bookings loaded successfully', bookings);
        const allBookings = Array.isArray(bookings) ? bookings : [];
        const pendingBookings = allBookings.filter((booking: any) =>
          booking.status === 'PENDING' || !booking.status
        );
        console.log('🔢 DashboardComponent: Pending demo bookings count:', pendingBookings.length);
        this.pendingDemoBookings.set(pendingBookings.length);
        this.loadCalendarEvents(allBookings);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading demo bookings', error);
        this.pendingDemoBookings.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load contacts for pending count
    console.log('📞 DashboardComponent: Loading contacts');
    this.apiService.getAllContacts().subscribe({
      next: (contacts: any) => {
        console.log('✅ DashboardComponent: Contacts loaded successfully', contacts);
        const allContacts = Array.isArray(contacts) ? contacts : [];
        const pendingContacts = allContacts.filter((contact: any) =>
          contact.status === 'NEW' || contact.status === 'PENDING' || !contact.status
        );
        console.log('🔢 DashboardComponent: Pending contacts count:', pendingContacts.length);
        this.pendingContacts.set(pendingContacts.length);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading contacts', error);
        this.pendingContacts.set(0);
        this.checkLoadingComplete();
      }
    });

    // Load feedbacks for pending count
    console.log('💬 DashboardComponent: Loading feedbacks');
    this.apiService.getAllFeedbacks().subscribe({
      next: (feedbacks: any) => {
        console.log('✅ DashboardComponent: Feedbacks loaded successfully', feedbacks);
        const allFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
        const pendingFeedbacks = allFeedbacks.filter((feedback: any) =>
          feedback.isApproved === false || feedback.isApproved === null
        );
        console.log('🔢 DashboardComponent: Pending feedbacks count:', pendingFeedbacks.length);
        this.pendingFeedbacks.set(pendingFeedbacks.length);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error loading feedbacks', error);
        this.pendingFeedbacks.set(0);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    console.log('⏳ DashboardComponent: Checking if loading is complete');
    // Simple check - in a real app, you'd track individual API calls
    setTimeout(() => {
      console.log('✅ DashboardComponent: Loading complete, setting isLoading to false');
      this.isLoading.set(false);
    }, 500);
  }

  private loadCalendarEvents(bookings: any[]): void {
    console.log('📅 DashboardComponent: Loading calendar events from bookings', bookings);
    const events: EventInput[] = bookings
      .filter((booking: any) => booking.preferredDate && booking.status !== 'CANCELLED')
      .map((booking: any) => {
        console.log('📅 DashboardComponent: Creating calendar event for booking:', booking);
        return {
          title: `Demo: ${booking.parentName || booking.name || 'Demo Booking'}`,
          start: booking.preferredDate,
          backgroundColor: this.getEventColor(booking.status),
          borderColor: this.getEventColor(booking.status),
          extendedProps: {
            booking: booking // Store full booking data
          }
        };
      });

    console.log('📅 DashboardComponent: Final calendar events:', events);
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };
  }

  private handleDateChange(dateInfo: any): void {
    console.log('📅 DashboardComponent: Calendar date range changed:', dateInfo);
    // Reload calendar events when date range changes
    this.refreshCalendarEvents();
  }

  private refreshCalendarEvents(): void {
    console.log('🔄 DashboardComponent: Refreshing calendar events');
    this.apiService.getAllDemoBookings().subscribe({
      next: (bookings: any) => {
        const allBookings = Array.isArray(bookings) ? bookings : [];
        this.loadCalendarEvents(allBookings);
      },
      error: (error) => {
        console.error('❌ DashboardComponent: Error refreshing calendar events', error);
      }
    });
  }

  private getEventColor(status: string): string {
    console.log('🎨 DashboardComponent: Getting event color for status:', status);
    const color = (() => {
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
    })();
    console.log('🎨 DashboardComponent: Event color:', color);
    return color;
  }

  navigateToProfile(): void {
    // Navigate to profile page (to be implemented)
    this.router.navigate(['/admin/profile']);
  }

  onKPICardClick(cardType: string): void {
    console.log('🖱️ DashboardComponent: KPI card clicked, type:', cardType);
    this.currentViewMode.set('table');
    this.selectedTableType.set(cardType);
    this.loadDetailedData(cardType);
  }

  private loadDetailedData(type: string): void {
    console.log('📊 DashboardComponent: Loading detailed data for type:', type);
    switch (type) {
      case 'students':
        console.log('👨‍🎓 DashboardComponent: Loading detailed students data');
        this.apiService.getUsersByRole('student').subscribe({
          next: (students: any) => {
            console.log('✅ DashboardComponent: Detailed students loaded:', students);
            console.log('📞 DashboardComponent: Student phone numbers:', students.map((s: any) => ({ id: s.userId, phone: s.phone })));
            this.detailedStudents.set(Array.isArray(students) ? students : []);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed students:', error);
            this.detailedStudents.set([]);
          }
        });
        break;

      case 'teachers':
        console.log('👨‍🏫 DashboardComponent: Loading detailed teachers data');
        this.apiService.getUsersByRole('teacher').subscribe({
          next: (teachers: any) => {
            console.log('✅ DashboardComponent: Detailed teachers loaded:', teachers);
            console.log('📞 DashboardComponent: Teacher phone numbers:', teachers.map((t: any) => ({ id: t.userId, phone: t.phone || 'N/A', fullData: t })));
            this.detailedTeachers.set(Array.isArray(teachers) ? teachers : []);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed teachers:', error);
            this.detailedTeachers.set([]);
          }
        });
        break;

      case 'courses':
        console.log('📚 DashboardComponent: Loading detailed courses data');
        this.apiService.getAllCourses().subscribe({
          next: (courses: any) => {
            console.log('✅ DashboardComponent: Detailed courses loaded:', courses);
            console.log('📋 DashboardComponent: Course fields:', courses.map((c: any) => ({
              courseId: c.courseId,
              courseName: c.courseName,
              description: c.description,
              createdBy: c.createdBy,
              createdAt: c.createdAt
            })));
            this.detailedCourses.set(Array.isArray(courses) ? courses : []);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed courses:', error);
            this.detailedCourses.set([]);
          }
        });
        break;

      case 'demo_pending':
        console.log('📅 DashboardComponent: Loading detailed demo bookings data');
        this.apiService.getAllDemoBookings().subscribe({
          next: (bookings: any) => {
            console.log('✅ DashboardComponent: Detailed demo bookings loaded:', bookings);
            const pendingBookings = Array.isArray(bookings)
              ? bookings.filter((booking: any) => booking.status === 'PENDING' || !booking.status)
              : [];
            console.log('🔢 DashboardComponent: Filtered pending demo bookings:', pendingBookings);
            this.detailedDemoBookings.set(pendingBookings);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed demo bookings:', error);
            this.detailedDemoBookings.set([]);
          }
        });
        break;

      case 'contact_pending':
        console.log('📞 DashboardComponent: Loading detailed contacts data');
        this.apiService.getAllContacts().subscribe({
          next: (contacts: any) => {
            console.log('✅ DashboardComponent: Detailed contacts loaded:', contacts);
            console.log('🔍 DashboardComponent: Contact status check:', contacts.map((c: any) => ({ id: c.id, status: c.status })));
            const pendingContacts = Array.isArray(contacts)
              ? contacts.filter((contact: any) => contact.status === 'NEW' || contact.status === 'PENDING' || !contact.status)
              : [];
            console.log('🔢 DashboardComponent: Filtered pending contacts:', pendingContacts);
            console.log('📊 DashboardComponent: Setting detailedContacts to:', pendingContacts.length, 'items');
            this.detailedContacts.set(pendingContacts);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed contacts:', error);
            this.detailedContacts.set([]);
          }
        });
        break;

      case 'feedback_pending':
        console.log('💬 DashboardComponent: Loading detailed feedbacks data');
        this.apiService.getAllFeedbacks().subscribe({
          next: (feedbacks: any) => {
            console.log('✅ DashboardComponent: Detailed feedbacks loaded:', feedbacks);
            console.log('🔍 DashboardComponent: Feedback approval status check:', feedbacks.map((f: any) => ({ id: f.id, isApproved: f.isApproved })));
            const pendingFeedbacks = Array.isArray(feedbacks)
              ? feedbacks.filter((feedback: any) => feedback.isApproved === false || feedback.isApproved === null)
              : [];
            console.log('🔢 DashboardComponent: Filtered pending feedbacks:', pendingFeedbacks);
            console.log('📊 DashboardComponent: Setting detailedFeedbacks to:', pendingFeedbacks.length, 'items');
            this.detailedFeedbacks.set(pendingFeedbacks);
          },
          error: (error) => {
            console.error('❌ DashboardComponent: Error loading detailed feedbacks:', error);
            this.detailedFeedbacks.set([]);
          }
        });
        break;
    }
  }

  backToCalendar(): void {
    console.log('⬅️ DashboardComponent: Back to calendar clicked');
    this.currentViewMode.set('calendar');
    this.selectedTableType.set('');
    // Refresh calendar events when returning to calendar view
    this.refreshCalendarEvents();
  }

  getTableTitle(): string {
    const title = (() => {
      switch (this.selectedTableType()) {
        case 'students': return 'All Students';
        case 'teachers': return 'All Teachers';
        case 'courses': return 'All Courses';
        case 'demo_pending': return 'Pending Demo Requests';
        case 'contact_pending': return 'Pending Contact Requests';
        case 'feedback_pending': return 'Pending Feedback Requests';
        default: return 'Details';
      }
    })();
    console.log('📋 DashboardComponent: Table title for type', this.selectedTableType(), ':', title);
    return title;
  }

  getStatusBadgeClass(status: string): string {
    console.log('🏷️ DashboardComponent: Getting status badge class for:', status);
    const badgeClass = (() => {
      switch (status?.toUpperCase()) {
        case 'ACTIVE':
        case 'CONFIRMED':
        case 'APPROVED':
          return 'bg-success';
        case 'INACTIVE':
        case 'CANCELLED':
          return 'bg-danger';
        case 'PENDING':
          return 'bg-warning text-dark';
        default:
          return 'bg-secondary';
      }
    })();
    console.log('🏷️ DashboardComponent: Status badge class:', badgeClass);
    return badgeClass;
  }
}

