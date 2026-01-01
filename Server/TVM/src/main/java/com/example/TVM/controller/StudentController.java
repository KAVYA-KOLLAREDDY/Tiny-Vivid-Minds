package com.example.TVM.controller;

import com.example.TVM.config.FileUploadConfig;
import com.example.TVM.dto.*;
import com.example.TVM.service.LevelLearningService;
import com.example.TVM.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/student")
@CrossOrigin(origins = "http://localhost:4200")
public class StudentController {

    private final StudentService studentService;
    private final LevelLearningService levelLearningService;
    private final FileUploadConfig fileUploadConfig;

    // ========== COURSES ==========
    
    @GetMapping("/courses")
    public ResponseEntity<List<CourseDTO>> getMyCourses() {
        List<CourseDTO> courses = studentService.getMyCourses();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/courses/{courseId}/levels")
    public ResponseEntity<List<CourseLevelDTO>> getCourseLevels(@PathVariable Integer courseId) {
        try {
            List<CourseLevelDTO> levels = studentService.getCourseLevels(courseId);
            return ResponseEntity.ok(levels);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== PROGRESS ==========

    @GetMapping("/progress")
    public ResponseEntity<List<StudentProgressDTO>> getMyProgress() {
        List<StudentProgressDTO> progress = studentService.getMyProgress();
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/progress/course/{courseId}")
    public ResponseEntity<List<StudentProgressDTO>> getMyProgressByCourse(@PathVariable Integer courseId) {
        List<StudentProgressDTO> progress = studentService.getMyProgressByCourse(courseId);
        return ResponseEntity.ok(progress);
    }

    // ========== ATTENDANCE ==========

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendance() {
        try {
            List<AttendanceDTO> attendance = studentService.getMyAttendance();
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attendance/course/{courseId}")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendanceByCourse(@PathVariable Integer courseId) {
        try {
            List<AttendanceDTO> attendance = studentService.getMyAttendanceByCourse(courseId);
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attendance/range")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendanceByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        try {
            List<AttendanceDTO> attendance = studentService.getMyAttendanceByDateRange(startDate, endDate);
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attendance/{attendanceId}")
    public ResponseEntity<AttendanceDTO> getAttendanceById(@PathVariable Integer attendanceId) {
        try {
            AttendanceDTO attendance = studentService.getAttendanceById(attendanceId);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== EXAM SUBMISSIONS ==========

    @GetMapping("/exam-submissions")
    public ResponseEntity<List<ExamSubmissionDTO>> getMyExamSubmissions() {
        try {
            List<ExamSubmissionDTO> submissions = studentService.getMyExamSubmissions();
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exam-submissions/course/{courseId}")
    public ResponseEntity<List<ExamSubmissionDTO>> getMyExamSubmissionsByCourse(@PathVariable Integer courseId) {
        try {
            List<ExamSubmissionDTO> submissions = studentService.getMyExamSubmissionsByCourse(courseId);
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exam-submissions/{submissionId}")
    public ResponseEntity<ExamSubmissionDTO> getExamSubmissionById(@PathVariable Integer submissionId) {
        try {
            ExamSubmissionDTO submission = studentService.getExamSubmissionById(submissionId);
            return ResponseEntity.ok(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/exam-submissions", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExamSubmissionDTO> createExamSubmission(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("courseId") Integer courseId,
            @RequestParam(value = "submittedNotes", required = false) String submittedNotes) {
        try {
            ExamSubmissionDTO submission = studentService.createExamSubmission(file, courseId, submittedNotes);
            return ResponseEntity.status(HttpStatus.CREATED).body(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/exam-submissions/{submissionId}")
    public ResponseEntity<ExamSubmissionDTO> updateExamSubmission(
            @PathVariable Integer submissionId,
            @RequestBody ExamSubmissionRequestDTO requestDTO) {
        try {
            ExamSubmissionDTO submission = studentService.updateExamSubmission(submissionId, requestDTO);
            return ResponseEntity.ok(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/exam-submissions/{submissionId}")
    public ResponseEntity<Void> deleteExamSubmission(@PathVariable Integer submissionId) {
        try {
            studentService.deleteExamSubmission(submissionId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== CERTIFICATES ==========

    @GetMapping("/certificates")
    public ResponseEntity<List<CertificateDTO>> getMyCertificates() {
        try {
            List<CertificateDTO> certificates = studentService.getMyCertificates();
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/certificates/course/{courseId}")
    public ResponseEntity<List<CertificateDTO>> getMyCertificatesByCourse(@PathVariable Integer courseId) {
        try {
            List<CertificateDTO> certificates = studentService.getMyCertificatesByCourse(courseId);
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/certificates/{certificateId}")
    public ResponseEntity<CertificateDTO> getCertificateById(@PathVariable Integer certificateId) {
        try {
            CertificateDTO certificate = studentService.getCertificateById(certificateId);
            return ResponseEntity.ok(certificate);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== FILE SERVING ==========

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileUploadConfig.getUploadDir()).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                // Determine content type
                String contentType = "application/octet-stream";
                try {
                    contentType = java.nio.file.Files.probeContentType(filePath);
                } catch (Exception e) {
                    // Use default content type
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ========== LEVEL LEARNING ENDPOINTS ==========

    @GetMapping("/levels/{levelId}/content")
    public ResponseEntity<List<LevelContentDTO>> getLevelContent(@PathVariable Integer levelId) {
        try {
            List<LevelContentDTO> content = levelLearningService.getLevelContent(levelId);
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/levels/{levelId}/activities")
    public ResponseEntity<List<LevelActivityDTO>> getLevelActivities(@PathVariable Integer levelId) {
        try {
            List<LevelActivityDTO> activities = levelLearningService.getLevelActivities(levelId);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/levels/{levelId}/activity-submissions")
    public ResponseEntity<List<LevelActivitySubmissionDTO>> getMyActivitySubmissionsForLevel(@PathVariable Integer levelId) {
        try {
            List<LevelActivitySubmissionDTO> submissions = levelLearningService.getMyActivitySubmissionsForLevel(levelId);
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/activities/{activityId}/latest-submission")
    public ResponseEntity<LevelActivitySubmissionDTO> getMyLatestSubmissionForActivity(@PathVariable Integer activityId) {
        try {
            LevelActivitySubmissionDTO submission = levelLearningService.getMyLatestSubmissionForActivity(activityId);
            if (submission != null) {
                return ResponseEntity.ok(submission);
            } else {
                return ResponseEntity.noContent().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/activities/{activityId}/submit")
    public ResponseEntity<LevelActivitySubmissionDTO> submitActivity(
            @PathVariable Integer activityId,
            @RequestBody ActivitySubmissionRequest request) {
        try {
            LevelActivitySubmissionDTO submission = levelLearningService.submitActivity(
                    activityId, request.getAnswers(), request.getSubmissionContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(submission);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/levels/{levelId}/can-complete")
    public ResponseEntity<Boolean> canCompleteLevel(@PathVariable Integer levelId) {
        try {
            boolean canComplete = levelLearningService.canCompleteLevel(levelId);
            return ResponseEntity.ok(canComplete);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/levels/{levelId}/complete")
    public ResponseEntity<String> completeLevel(@PathVariable Integer levelId) {
        try {
            levelLearningService.completeLevel(levelId);
            return ResponseEntity.ok("Level completed successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to complete level");
        }
    }

    // Request DTO for activity submission
    public static class ActivitySubmissionRequest {
        private String answers;
        private String submissionContent;

        public String getAnswers() { return answers; }
        public void setAnswers(String answers) { this.answers = answers; }
        public String getSubmissionContent() { return submissionContent; }
        public void setSubmissionContent(String submissionContent) { this.submissionContent = submissionContent; }
    }
}

