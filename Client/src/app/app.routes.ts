import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './components/about/about.component';
import { AbacusComponent } from './components/courses/abacus/abacus.component';
import { VedicMathsComponent } from './components/courses/vedic-maths/vedic-maths.component';
import { PersonalizedCoachingComponent } from './components/courses/personalized-coaching/personalized-coaching.component';
import { ContactComponent } from './components/contact/contact.component';
import { MediaComponent } from './components/media/media.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { RegisterTeacherComponent } from './components/auth/register-teacher/register-teacher.component';
import { RegisterStudentComponent } from './components/auth/register-student/register-student.component';
import { AdminComponent } from './admin/admin.component';
import { TeacherComponent } from './teacher/teacher.component';
import { StudentComponent } from './student/student.component';
import { ManageUsersComponent } from './admin/manage-users/manage-users.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ManageCoursesComponent } from './admin/manage-courses/manage-courses.component';
import { TeacherAssignmentComponent } from './admin/teacher-assignment/teacher-assignment.component';
import { StudentAssignmentComponent } from './admin/student-assignment/student-assignment.component';
import { FeedbackReportsComponent } from './admin/feedback-reports/feedback-reports.component';
import { MyStudentsComponent } from './teacher/my-students/my-students.component';
import { TeacherDashboardComponent } from './teacher/dashboard/dashboard.component';
import { StudentProgressComponent } from './teacher/student-progress/student-progress.component';
import { ProgressManagementComponent } from './teacher/progress-management/progress-management.component';
import { CalendarComponent } from './teacher/calendar/calendar.component';
import { MarkAttendanceComponent } from './teacher/mark-attendance/mark-attendance.component';
import { ExamManagementComponent } from './teacher/exam-management/exam-management.component';
import { MyCoursesComponent } from './student/my-courses/my-courses.component';
import { StudentDashboardComponent } from './student/dashboard/dashboard.component';
import { StudentAttendanceComponent } from './student/attendance/attendance.component';
import { ExamSubmissionComponent } from './student/exam-submission/exam-submission.component';
import { CertificatesComponent } from './student/certificates/certificates.component';
import { MyProgressComponent } from './student/my-progress/my-progress.component';
import { adminGuard, adminChildGuard } from './guards/admin.guard';
import { teacherGuard, teacherChildGuard } from './guards/teacher.guard';
import { studentGuard, studentChildGuard } from './guards/student.guard';

export const routes: Routes = [
  // Auth routes first
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/register/teacher', component: RegisterTeacherComponent },
  { path: 'auth/register/student', component: RegisterStudentComponent },

  // Admin routes (before public routes to avoid conflicts)
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminChildGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: ManageUsersComponent },
      { path: 'courses', component: ManageCoursesComponent },
      { path: 'assignments', component: TeacherAssignmentComponent },
      { path: 'student-assignments', component: StudentAssignmentComponent },
      { path: 'feedbacks', component: FeedbackReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Teacher routes
  {
    path: 'teacher',
    component: TeacherComponent,
    canActivate: [teacherGuard],
    canActivateChild: [teacherChildGuard],
    children: [
      { path: 'dashboard', component: TeacherDashboardComponent },
      { path: 'students', component: MyStudentsComponent },
      { path: 'students/:studentId/courses/:courseId/progress', component: StudentProgressComponent },
      { path: 'progress', component: ProgressManagementComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'attendance', component: MarkAttendanceComponent },
      { path: 'exams', component: ExamManagementComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Student routes
  {
    path: 'student',
    component: StudentComponent,
    canActivate: [studentGuard],
    canActivateChild: [studentChildGuard],
    children: [
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'courses', component: MyCoursesComponent },
      { path: 'progress', component: MyProgressComponent },
      { path: 'attendance', component: StudentAttendanceComponent },
      { path: 'exam-submission', component: ExamSubmissionComponent },
      { path: 'certificates', component: CertificatesComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Public routes
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'courses/abacus', component: AbacusComponent },
  { path: 'courses/vedic-maths', component: VedicMathsComponent },
  {
    path: 'courses/personalized-coaching',
    component: PersonalizedCoachingComponent,
  },
  { path: 'contact', component: ContactComponent },
  { path: 'media', component: MediaComponent },
  // Wildcard route (must be last)
  { path: '**', redirectTo: '' },
];
