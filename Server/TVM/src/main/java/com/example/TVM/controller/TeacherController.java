package com.example.TVM.controller;

import com.example.TVM.dto.*;
import com.example.TVM.entity.Certificate;
import com.example.TVM.entity.ClassSchedule;
import com.example.TVM.service.CertificateService;
import com.example.TVM.service.TeacherService;
import com.example.TVM.service.ClassScheduleService;
import com.example.TVM.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/teacher")
@CrossOrigin(origins = "http://localhost:4200")
public class TeacherController {

    private final TeacherService teacherService;
    private final ClassScheduleService scheduleService;
    private final StudentService studentService;
    private final CertificateService certificateService;

    @GetMapping("/students")
    public ResponseEntity<List<StudentAssignmentDTO>> getMyStudents() {
        List<StudentAssignmentDTO> students = teacherService.getMyStudents();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/all-students")
    public ResponseEntity<List<UserDTO>> getAllMyStudents() {
        try {
            List<UserDTO> students = teacherService.getAllMyStudents();
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<ClassScheduleDTO>> getMyCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<ClassScheduleDTO> schedule = teacherService.getMyCalendar(start, end);
        return ResponseEntity.ok(schedule);
    }

    // ========== ATTENDANCE (Teacher) ==========

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDTO> attendance = teacherService.getMyAttendance(startDate, endDate);
        return ResponseEntity.ok(attendance);
    }

    @PostMapping("/attendance")
    public ResponseEntity<AttendanceDTO> createOrUpdateAttendance(
            @RequestBody AttendanceRequestDTO requestDTO) {
        try {
            AttendanceDTO attendance = teacherService.upsertAttendance(requestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/attendance/{attendanceId}")
    public ResponseEntity<AttendanceDTO> updateAttendance(
            @PathVariable Integer attendanceId,
            @RequestBody AttendanceRequestDTO requestDTO) {
        try {
            AttendanceDTO attendance = teacherService.updateAttendance(attendanceId, requestDTO);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/attendance/{attendanceId}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Integer attendanceId) {
        try {
            teacherService.deleteAttendance(attendanceId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/students/{studentId}/courses/{courseId}/progress")
    public ResponseEntity<List<StudentProgressDTO>> getStudentProgress(
            @PathVariable Integer studentId,
            @PathVariable Integer courseId) {
        try {
            List<StudentProgressDTO> progress = teacherService.getStudentProgress(studentId, courseId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/students/{studentId}/courses/{courseId}/levels/{levelId}/progress")
    public ResponseEntity<StudentProgressDTO> getStudentLevelProgress(
            @PathVariable Integer studentId,
            @PathVariable Integer courseId,
            @PathVariable Integer levelId) {
        try {
            StudentProgressDTO progress = teacherService.getStudentLevelProgress(studentId, courseId, levelId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/students/{studentId}/courses/{courseId}/levels/{levelId}/progress")
    public ResponseEntity<StudentProgressDTO> updateStudentLevel(
            @PathVariable Integer studentId,
            @PathVariable Integer courseId,
            @PathVariable Integer levelId,
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {
        try {
            StudentProgressDTO progress = teacherService.updateStudentLevel(
                    studentId, courseId, levelId, status, remarks);
            return ResponseEntity.ok(progress);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Class Schedule Management
    @PostMapping("/schedules")
    public ResponseEntity<ClassScheduleDTO> createSchedule(@RequestBody ClassScheduleDTO dto) {
        try {
            ClassScheduleDTO created = scheduleService.createSchedule(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/assignments/{assignmentId}/schedules")
    public ResponseEntity<List<ClassScheduleDTO>> getSchedulesByAssignment(@PathVariable Integer assignmentId) {
        List<ClassScheduleDTO> schedules = scheduleService.getSchedulesByAssignment(assignmentId);
        return ResponseEntity.ok(schedules);
    }

    @PutMapping("/schedules/{classId}/status")
    public ResponseEntity<ClassScheduleDTO> updateScheduleStatus(
            @PathVariable Integer classId,
            @RequestParam String status) {
        try {
            ClassSchedule.ClassStatus classStatus = ClassSchedule.ClassStatus.valueOf(status.toLowerCase());
            ClassScheduleDTO updated = scheduleService.updateScheduleStatus(classId, classStatus);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/schedules/{classId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Integer classId) {
        try {
            scheduleService.deleteSchedule(classId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/courses/{courseId}/levels")
    public ResponseEntity<List<CourseLevelDTO>> getCourseLevels(@PathVariable Integer courseId) {
        try {
            List<CourseLevelDTO> levels = teacherService.getCourseLevels(courseId);
            return ResponseEntity.ok(levels);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ========== EXAM SUBMISSION MANAGEMENT ==========

    @GetMapping("/exam-submissions")
    public ResponseEntity<List<ExamSubmissionDTO>> getMyExamSubmissions() {
        try {
            List<ExamSubmissionDTO> submissions = teacherService.getMyExamSubmissions();
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exam-submissions/course/{courseId}")
    public ResponseEntity<List<ExamSubmissionDTO>> getMyExamSubmissionsByCourse(@PathVariable Integer courseId) {
        try {
            List<ExamSubmissionDTO> submissions = teacherService.getMyExamSubmissionsByCourse(courseId);
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/exam-submissions/{submissionId}/grade")
    public ResponseEntity<ExamSubmissionDTO> gradeExamSubmission(
            @PathVariable Integer submissionId,
            @RequestBody GradeSubmissionDTO gradeDTO) {
        try {
            ExamSubmissionDTO submission = teacherService.gradeExamSubmission(submissionId, gradeDTO);
            return ResponseEntity.ok(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/exam-submissions/{submissionId}/status")
    public ResponseEntity<ExamSubmissionDTO> updateExamSubmissionStatus(
            @PathVariable Integer submissionId,
            @RequestParam String status) {
        try {
            ExamSubmissionDTO submission = teacherService.updateExamSubmissionStatus(submissionId, status);
            return ResponseEntity.ok(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== CERTIFICATE MANAGEMENT ==========

    @PostMapping("/exam-submissions/{submissionId}/certificate")
    public ResponseEntity<CertificateDTO> issueCertificate(@PathVariable Integer submissionId) {
        try {
            // Get current teacher from security context (assuming you have authentication)
            // For now, we'll pass null and handle teacher validation in service if needed
            Certificate certificate = certificateService.generateAndStoreCertificate(submissionId, null);

            // Convert to DTO
            CertificateDTO certificateDTO = new CertificateDTO(
                certificate.getCertificateId(),
                certificate.getStudent().getUserId(),
                certificate.getStudent().getFullName(),
                certificate.getCourse().getCourseId(),
                certificate.getCourse().getCourseName(),
                certificate.getVerificationCode(),
                certificate.getDownloadUrl(),
                certificate.getCertificatePath(),
                certificate.getPercentage(),
                certificate.getCompletedLevel(),
                certificate.getExamSubmissionId(),
                certificate.getIssuedDate()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(certificateDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}

