import { inject, Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private envUrl = environment.apiUrl;
  private commonService = inject(CommonService);

  // User Management
  getAllUsers() {
    return this.commonService.get(`${this.envUrl}/admin/users`);
  }

  getUsersByRole(role: string) {
    return this.commonService.get(`${this.envUrl}/admin/users/role/${role}`);
  }

  getUsersByStatus(status: string) {
    return this.commonService.get(
      `${this.envUrl}/admin/users/status/${status}`
    );
  }

  updateUserStatus(userId: number, status: string) {
    return this.commonService.put(
      `${this.envUrl}/admin/users/${userId}/status`,
      status
    );
  }

  deleteUser(userId: number) {
    return this.commonService.delete(`${this.envUrl}/admin/users/${userId}`);
  }

  // Course Management
  getAllCourses() {
    return this.commonService.get(`${this.envUrl}/admin/courses`);
  }

  createCourse(course: any) {
    return this.commonService.post(`${this.envUrl}/admin/courses`, course);
  }

  updateCourse(courseId: number, course: any) {
    return this.commonService.put(
      `${this.envUrl}/admin/courses/${courseId}`,
      course
    );
  }

  deleteCourse(courseId: number) {
    return this.commonService.delete(
      `${this.envUrl}/admin/courses/${courseId}`
    );
  }

  // Course Level Management
  getLevelsByCourse(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/admin/courses/${courseId}/levels`
    );
  }

  createLevel(courseId: number, level: any) {
    return this.commonService.post(
      `${this.envUrl}/admin/courses/${courseId}/levels`,
      level
    );
  }

  updateLevel(levelId: number, level: any) {
    return this.commonService.put(
      `${this.envUrl}/admin/courses/levels/${levelId}`,
      level
    );
  }

  deleteLevel(levelId: number) {
    return this.commonService.delete(
      `${this.envUrl}/admin/courses/levels/${levelId}`
    );
  }

  // Assignment Management
  getAllTeacherAssignments() {
    return this.commonService.get(
      `${this.envUrl}/admin/assignments/teacher-course`
    );
  }

  getAllStudentAssignments() {
    return this.commonService.get(
      `${this.envUrl}/admin/assignments/student-teacher`
    );
  }

  assignTeacherToCourse(teacherId: number, courseId: number) {
    return this.commonService.post(
      `${this.envUrl}/admin/assign/teacher-course?teacherId=${teacherId}&courseId=${courseId}`,
      {}
    );
  }

  unassignTeacherFromCourse(assignmentId: number) {
    return this.commonService.delete(
      `${this.envUrl}/admin/assignments/teacher-course/${assignmentId}`
    );
  }

  assignStudentToTeacher(assignment: any) {
    return this.commonService.post(
      `${this.envUrl}/admin/assign/student-teacher`,
      assignment
    );
  }

  // Feedback Management
  getAllFeedbacks() {
    return this.commonService.get(`${this.envUrl}/admin/feedbacks`);
  }

  // Alias for public feedback access
  getFeedbacks() {
    return this.commonService.get(`${this.envUrl}/feedback`);
  }

  createFeedback(feedback: any) {
    return this.commonService.post(`${this.envUrl}/feedback`, feedback);
  }

  approveFeedback(feedbackId: number) {
    return this.commonService.put(
      `${this.envUrl}/admin/feedbacks/${feedbackId}/approve`,
      {}
    );
  }

  rejectFeedback(feedbackId: number) {
    return this.commonService.put(
      `${this.envUrl}/admin/feedbacks/${feedbackId}/reject`,
      {}
    );
  }

  // Demo Booking Management
  getAllDemoBookings() {
    return this.commonService.get(`${this.envUrl}/admin/demo-bookings`);
  }

  bookDemo(demoBooking: any) {
    return this.commonService.post(`${this.envUrl}/book-demo`, demoBooking);
  }

  updateDemoBookingStatus(bookingId: number, status: string) {
    return this.commonService.put(
      `${this.envUrl}/admin/demo-bookings/${bookingId}/status`,
      status
    );
  }

  // Contact Management
  getAllContacts() {
    return this.commonService.get(`${this.envUrl}/admin/contacts`);
  }

  createContact(contact: any) {
    return this.commonService.post(`${this.envUrl}/contact`, contact);
  }

  updateContactStatus(contactId: number, status: string) {
    return this.commonService.put(
      `${this.envUrl}/admin/contacts/${contactId}/status`,
      status
    );
  }

  // Teacher APIs
  getMyStudents() {
    return this.commonService.get(`${this.envUrl}/teacher/students`);
  }

  getAllMyStudents() {
    return this.commonService.get(`${this.envUrl}/teacher/all-students`);
  }

  getMyAttendanceForTeacher(startDate: string, endDate: string) {
    return this.commonService.get(
      `${this.envUrl}/teacher/attendance?startDate=${startDate}&endDate=${endDate}`
    );
  }

  createAttendance(attendance: any) {
    return this.commonService.post(
      `${this.envUrl}/teacher/attendance`,
      attendance
    );
  }

  updateAttendance(attendanceId: number, attendance: any) {
    return this.commonService.put(
      `${this.envUrl}/teacher/attendance/${attendanceId}`,
      attendance
    );
  }

  deleteAttendance(attendanceId: number) {
    return this.commonService.delete(
      `${this.envUrl}/teacher/attendance/${attendanceId}`
    );
  }

  // Get course by ID (for teacher access - might need backend endpoint)
  getCourseById(courseId: number) {
    // Note: This might need a teacher-specific endpoint
    // For now, using admin endpoint but it should be accessible to teachers
    return this.commonService.get(`${this.envUrl}/admin/courses/${courseId}`);
  }

  // Get levels by course for teacher
  getLevelsByCourseForTeacher(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/teacher/courses/${courseId}/levels`
    );
  }

  getMyCalendar(start: string, end: string) {
    return this.commonService.get(
      `${this.envUrl}/teacher/calendar?start=${start}&end=${end}`
    );
  }

  updateStudentLevel(
    studentId: number,
    courseId: number,
    levelId: number,
    status: string,
    remarks?: string
  ) {
    const url = `${
      this.envUrl
    }/teacher/students/${studentId}/courses/${courseId}/levels/${levelId}/progress?status=${status}${
      remarks ? '&remarks=' + remarks : ''
    }`;
    return this.commonService.put(url, {});
  }

  getStudentProgress(studentId: number, courseId: number) {
    return this.commonService.get(`${this.envUrl}/teacher/students/${studentId}/courses/${courseId}/progress`);
  }

  getStudentLevelProgress(studentId: number, courseId: number, levelId: number) {
    return this.commonService.get(`${this.envUrl}/teacher/students/${studentId}/courses/${courseId}/levels/${levelId}/progress`);
  }

  // Schedule Management
  createSchedule(schedule: any) {
    return this.commonService.post(
      `${this.envUrl}/teacher/schedules`,
      schedule
    );
  }
  getSchedulesByAssignment(assignmentId: number) {
    return this.commonService.get(
      `${this.envUrl}/teacher/assignments/${assignmentId}/schedules`
    );
  }

  updateScheduleStatus(classId: number, status: string) {
    return this.commonService.put(
      `${this.envUrl}/teacher/schedules/${classId}/status?status=${status}`,
      {}
    );
  }

  deleteSchedule(classId: number) {
    return this.commonService.delete(
      `${this.envUrl}/teacher/schedules/${classId}`
    );
  }

  // Student APIs
  getMyCourses() {
    return this.commonService.get(`${this.envUrl}/student/courses`);
  }

  getMyProgress() {
    return this.commonService.get(`${this.envUrl}/student/progress`);
  }

  getMyProgressByCourse(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/progress/course/${courseId}`
    );
  }

  getCourseLevelsForStudent(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/courses/${courseId}/levels`
    );
  }

  // Student Attendance APIs
  getMyAttendance() {
    return this.commonService.get(`${this.envUrl}/student/attendance`);
  }

  getMyAttendanceByCourse(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/attendance/course/${courseId}`
    );
  }

  getMyAttendanceByDateRange(startDate: string, endDate: string) {
    return this.commonService.get(
      `${this.envUrl}/student/attendance/range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getAttendanceById(attendanceId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/attendance/${attendanceId}`
    );
  }

  // Student Exam Submission APIs
  getMyExamSubmissions() {
    return this.commonService.get(`${this.envUrl}/student/exam-submissions`);
  }

  getMyExamSubmissionsByCourse(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/exam-submissions/course/${courseId}`
    );
  }

  getExamSubmissionById(submissionId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/exam-submissions/${submissionId}`
    );
  }


  updateExamSubmission(submissionId: number, submission: any) {
    return this.commonService.put(
      `${this.envUrl}/student/exam-submissions/${submissionId}`,
      submission
    );
  }

  deleteExamSubmission(submissionId: number) {
    return this.commonService.delete(
      `${this.envUrl}/student/exam-submissions/${submissionId}`
    );
  }

  // Join Us
  joinUs(joinUsData: any) {
    return this.commonService.post(`${this.envUrl}/join-us`, joinUsData);
  }

  // Student Certificate APIs
  getMyCertificates() {
    return this.commonService.get(`${this.envUrl}/student/certificates`);
  }

  getMyCertificatesByCourse(courseId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/certificates/course/${courseId}`
    );
  }

  getCertificateById(certificateId: number) {
    return this.commonService.get(
      `${this.envUrl}/student/certificates/${certificateId}`
    );
  }

  // Exam Submission APIs (Updated for file upload)
  createExamSubmission(formData: FormData) {
    return this.commonService.post(`${this.envUrl}/student/exam-submissions`, formData);
  }

  // Teacher Exam Grading APIs
  getTeacherExamSubmissions() {
    return this.commonService.get(`${this.envUrl}/teacher/exam-submissions`);
  }

  getTeacherExamSubmissionsByCourse(courseId: number) {
    return this.commonService.get(`${this.envUrl}/teacher/exam-submissions/course/${courseId}`);
  }

  gradeExamSubmission(submissionId: number, gradeData: any) {
    return this.commonService.put(`${this.envUrl}/teacher/exam-submissions/${submissionId}/grade`, gradeData);
  }

  updateExamSubmissionStatus(submissionId: number, status: string) {
    return this.commonService.put(`${this.envUrl}/teacher/exam-submissions/${submissionId}/status?status=${status}`, {});
  }

  // File serving
  getFileUrl(filename: string) {
    return `${this.envUrl}/student/files/${filename}`;
  }

  // Level Learning APIs
  getLevelContent(levelId: number) {
    return this.commonService.get(`${this.envUrl}/student/levels/${levelId}/content`);
  }

  getLevelActivities(levelId: number) {
    return this.commonService.get(`${this.envUrl}/student/levels/${levelId}/activities`);
  }

  getMyActivitySubmissionsForLevel(levelId: number) {
    return this.commonService.get(`${this.envUrl}/student/levels/${levelId}/activity-submissions`);
  }

  getMyLatestSubmissionForActivity(activityId: number) {
    return this.commonService.get(`${this.envUrl}/student/activities/${activityId}/latest-submission`);
  }

  submitActivity(activityId: number, submissionData: any) {
    return this.commonService.post(`${this.envUrl}/student/activities/${activityId}/submit`, submissionData);
  }


  canCompleteLevel(levelId: number) {
    return this.commonService.get(`${this.envUrl}/student/levels/${levelId}/can-complete`);
  }

  completeLevel(levelId: number) {
    return this.commonService.post(`${this.envUrl}/student/levels/${levelId}/complete`, {});
  }
}
