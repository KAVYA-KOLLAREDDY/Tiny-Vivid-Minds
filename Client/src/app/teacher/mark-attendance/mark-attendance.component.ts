import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface AttendanceRecord {
  id?: number;
  classId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  classDate: string;
  status: 'Present' | 'Absent' | 'Rescheduled';
  remarks: string;
}

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mark-attendance.component.html',
  styleUrls: ['./mark-attendance.component.css']
})
export class MarkAttendanceComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  attendanceRecords = signal<AttendanceRecord[]>([]);
  schedules = signal<any[]>([]);
  assignments = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  showAddModal = signal<boolean>(false);

  // Form data for new attendance
  newAttendance = signal<AttendanceRecord>({
    classId: 0,
    studentId: 0,
    studentName: '',
    courseId: 0,
    courseName: '',
    classDate: new Date().toISOString().split('T')[0],
    status: 'Present',
    remarks: ''
  });

  // Available students for dropdown
  availableStudents = signal<Array<{studentId: number, studentName: string, courseId: number, courseName: string}>>([]);

  ngOnInit(): void {
    this.loadAttendanceData();
  }

  loadAttendanceData(): void {
    this.isLoading.set(true);

    // Load assignments to get student and course info
    this.apiService.getMyStudents().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        this.assignments.set(Array.isArray(data) ? data : []);
        this.prepareAvailableStudents();
        this.loadAttendanceRecords();
      }, () => {
        this.assignments.set([]);
        this.loadAttendanceRecords();
      })
    );
  }

  loadAttendanceRecords(): void {
    // Load attendance records from backend
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 3); // 3 months back
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    this.apiService.getMyAttendanceForTeacher(startDateStr, endDateStr).subscribe(
      handleResponse(this.loggingService, (attendance: any) => {
        const records = Array.isArray(attendance) ? attendance : [];
        this.attendanceRecords.set(records.map((a: any) => ({
          id: a.attendanceId,
          classId: 0, // Not used in backend
          studentId: a.studentId,
          studentName: a.studentName,
          courseId: a.courseId,
          courseName: a.courseName,
          classDate: a.classDate,
          status: a.status,
          remarks: a.remarks || ''
        })));
        this.isLoading.set(false);
      }, () => {
        // Fallback: try loading from schedules if attendance API fails
        this.loadSchedules();
      })
    );
  }

  loadSchedules(): void {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 3); // 3 months back
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    this.apiService.getMyCalendar(start, end).subscribe(
      handleResponse(this.loggingService, (schedules: any) => {
        const schedulesList = Array.isArray(schedules) ? schedules : [];
        this.schedules.set(schedulesList);
        this.processAttendanceRecords(schedulesList);
        this.isLoading.set(false);
      }, () => {
        this.schedules.set([]);
        this.isLoading.set(false);
      })
    );
  }

  prepareAvailableStudents(): void {
    const assignments = this.assignments();
    const studentsMap = new Map<string, {studentId: number, studentName: string, courseId: number, courseName: string}>();

    assignments.forEach(assignment => {
      const key = `${assignment.studentId}-${assignment.courseId}`;
      if (!studentsMap.has(key)) {
        studentsMap.set(key, {
          studentId: assignment.studentId,
          studentName: assignment.studentName || `Student ${assignment.studentId}`,
          courseId: assignment.courseId,
          courseName: assignment.courseName || `Course ${assignment.courseId}`
        });
      }
    });

    this.availableStudents.set(Array.from(studentsMap.values()));
  }

  processAttendanceRecords(schedules: any[]): void {
    const assignments = this.assignments();
    const records: AttendanceRecord[] = schedules
      .filter((schedule: any) => schedule.scheduledDate)
      .map((schedule: any) => {
        const assignment = assignments.find(a => a.assignmentId === schedule.assignmentId);
        const scheduledDate = new Date(schedule.scheduledDate);
        
        // Determine status from schedule status
        let status: 'Present' | 'Absent' | 'Rescheduled' = 'Present';
        if (schedule.status === 'CANCELLED') {
          status = 'Rescheduled';
        } else if (schedule.status === 'COMPLETED') {
          status = 'Present';
        }

        return {
          id: schedule.classId,
          classId: schedule.classId,
          studentId: assignment?.studentId || 0,
          studentName: assignment?.studentName || `Student ${assignment?.studentId || 'Unknown'}`,
          courseId: assignment?.courseId || 0,
          courseName: assignment?.courseName || `Course ${assignment?.courseId || 'Unknown'}`,
          classDate: scheduledDate.toISOString().split('T')[0],
          status: status,
          remarks: schedule.topic || ''
        };
      });

    this.attendanceRecords.set(records);
  }

  openAddModal(): void {
    this.newAttendance.set({
      classId: 0,
      studentId: 0,
      studentName: '',
      courseId: 0,
      courseName: '',
      classDate: new Date().toISOString().split('T')[0],
      status: 'Present',
      remarks: ''
    });
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  onStudentChange(studentId: string): void {
    const id = parseInt(studentId);
    const student = this.availableStudents().find(s => s.studentId === id);
    if (student) {
      const current = this.newAttendance();
      this.newAttendance.set({
        ...current,
        studentId: student.studentId,
        studentName: student.studentName,
        courseId: student.courseId,
        courseName: student.courseName
      });
    }
  }

  onClassDateChange(date: string): void {
    const current = this.newAttendance();
    this.newAttendance.set({
      ...current,
      classDate: date
    });
  }

  onStatusChange(status: string): void {
    const current = this.newAttendance();
    this.newAttendance.set({
      ...current,
      status: status as 'Present' | 'Absent' | 'Rescheduled'
    });
  }

  onRemarksChange(remarks: string): void {
    const current = this.newAttendance();
    this.newAttendance.set({
      ...current,
      remarks: remarks
    });
  }

  addAttendanceRecord(): void {
    const newRecord = this.newAttendance();
    
    if (!newRecord.studentId || !newRecord.courseId || !newRecord.classDate) {
      this.loggingService.onError('Please fill in all required fields');
      return;
    }

    // Prepare request payload
    const attendanceData = {
      studentId: newRecord.studentId,
      courseId: newRecord.courseId,
      teacherId: 0, // Will be set by backend from current user
      classDate: newRecord.classDate,
      status: newRecord.status,
      remarks: newRecord.remarks || ''
    };

    // Call API to create/update attendance (upsert - creates if not exists, updates if exists)
    this.apiService.createAttendance(attendanceData).subscribe(
      handleResponse(this.loggingService, (response: any) => {
        // Reload attendance data to get the updated list
        this.loadAttendanceRecords();
        this.loggingService.onSuccess('Attendance record saved successfully!');
        this.closeAddModal();
      }, () => {
        this.loggingService.onError('Failed to save attendance record');
      })
    );
  }

  updateAttendanceStatus(record: AttendanceRecord, status: 'Present' | 'Absent' | 'Rescheduled'): void {
    if (!record.id) {
      this.loggingService.onError('Cannot update: Attendance record ID missing');
      return;
    }

    const attendanceData = {
      studentId: record.studentId,
      courseId: record.courseId,
      teacherId: 0, // Will be set by backend
      classDate: record.classDate,
      status: status,
      remarks: record.remarks || ''
    };

    // Call API to update attendance
    this.apiService.updateAttendance(record.id, attendanceData).subscribe(
      handleResponse(this.loggingService, (response: any) => {
        // Reload attendance data
        this.loadAttendanceRecords();
        this.loggingService.onSuccess(`Attendance status updated to ${status}`);
      }, () => {
        this.loggingService.onError('Failed to update attendance status');
      })
    );
  }

  updateRemarks(record: AttendanceRecord, remarks: string): void {
    this.attendanceRecords.update(records => 
      records.map(r => r.id === record.id ? { ...r, remarks } : r)
    );
  }

  saveRemarks(record: AttendanceRecord): void {
    if (!record.id) {
      this.loggingService.onError('Cannot save: Attendance record ID missing');
      return;
    }

    const attendanceData = {
      studentId: record.studentId,
      courseId: record.courseId,
      teacherId: 0, // Will be set by backend
      classDate: record.classDate,
      status: record.status,
      remarks: record.remarks || ''
    };

    // Call API to update attendance with new remarks
    this.apiService.updateAttendance(record.id, attendanceData).subscribe(
      handleResponse(this.loggingService, (response: any) => {
        // Reload attendance data
        this.loadAttendanceRecords();
        this.loggingService.onSuccess('Remarks saved successfully!');
      }, () => {
        this.loggingService.onError('Failed to save remarks');
      })
    );
  }

  deleteRecord(record: AttendanceRecord): void {
    if (!record.id) {
      this.loggingService.onError('Cannot delete: Attendance record ID missing');
      return;
    }

    if (confirm('Are you sure you want to delete this attendance record?')) {
      // Call API to delete attendance
      this.apiService.deleteAttendance(record.id).subscribe(
        handleResponse(this.loggingService, () => {
          // Reload attendance data
          this.loadAttendanceRecords();
          this.loggingService.onSuccess('Attendance record deleted successfully!');
        }, () => {
          this.loggingService.onError('Failed to delete attendance record');
        })
      );
    }
  }

  formatDate(dateString: string): string {
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Present':
        return 'status-present';
      case 'Absent':
        return 'status-absent';
      case 'Rescheduled':
        return 'status-rescheduled';
      default:
        return 'status-present';
    }
  }
}
