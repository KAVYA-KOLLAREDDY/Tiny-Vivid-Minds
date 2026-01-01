package com.example.TVM.service;

import com.example.TVM.config.FileUploadConfig;
import com.example.TVM.dto.*;
import com.example.TVM.entity.*;
import com.example.TVM.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
public class StudentService {
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final StudentProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final CourseLevelRepository levelRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamSubmissionRepository examSubmissionRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final FileUploadConfig fileUploadConfig;

    public List<CourseDTO> getMyCourses() {
        User currentUser = authService.getUser();
        List<StudentTeacherAssignment> assignments = assignmentRepository
                .findByStudentUserIdAndStatus(currentUser.getUserId(), 
                        StudentTeacherAssignment.AssignmentStatus.active);
        return assignments.stream()
                .map(assignment -> mapCourseToDTO(assignment.getCourse()))
                .distinct()
                .collect(Collectors.toList());
    }

    public List<StudentProgressDTO> getMyProgress() {
        User currentUser = authService.getUser();
        return progressRepository.findByStudentUserId(currentUser.getUserId()).stream()
                .map(this::mapProgressToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentProgressDTO> getMyProgressByCourse(Integer courseId) {
        User currentUser = authService.getUser();
        return progressRepository.findByStudentUserIdAndCourseCourseId(currentUser.getUserId(), courseId).stream()
                .map(this::mapProgressToDTO)
                .collect(Collectors.toList());
    }

    private CourseDTO mapCourseToDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setCourseId(course.getCourseId());
        dto.setCourseName(course.getCourseName());
        dto.setDescription(course.getDescription());
        dto.setCreatedBy(course.getCreatedBy() != null ? course.getCreatedBy().getUserId() : null);
        dto.setCreatedAt(course.getCreatedAt());
        return dto;
    }

    private StudentProgressDTO mapProgressToDTO(StudentProgress progress) {
        StudentProgressDTO dto = new StudentProgressDTO();
        dto.setProgressId(progress.getProgressId());
        dto.setStudentId(progress.getStudent().getUserId());
        dto.setCourseId(progress.getCourse().getCourseId());
        dto.setLevelId(progress.getLevel().getLevelId());
        dto.setProgressStatus(progress.getProgressStatus().name());
        dto.setCompletionDate(progress.getCompletionDate());
        dto.setRemarks(progress.getRemarks());
        return dto;
    }

    // ========== ATTENDANCE CRUD ==========

    public List<AttendanceDTO> getMyAttendance() {
        User currentUser = authService.getUser();
        return attendanceRepository.findByStudentUserId(currentUser.getUserId()).stream()
                .map(this::mapAttendanceToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getMyAttendanceByCourse(Integer courseId) {
        User currentUser = authService.getUser();
        return attendanceRepository.findByStudentUserIdAndCourseCourseId(currentUser.getUserId(), courseId).stream()
                .map(this::mapAttendanceToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getMyAttendanceByDateRange(LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getUser();
        return attendanceRepository.findByStudentUserIdAndClassDateBetween(
                currentUser.getUserId(), startDate, endDate).stream()
                .map(this::mapAttendanceToDTO)
                .collect(Collectors.toList());
    }

    public AttendanceDTO getAttendanceById(Integer attendanceId) {
        User currentUser = authService.getUser();
        Optional<Attendance> attendance = attendanceRepository.findById(attendanceId);
        
        if (attendance.isPresent() && attendance.get().getStudent().getUserId().equals(currentUser.getUserId())) {
            return mapAttendanceToDTO(attendance.get());
        }
        throw new RuntimeException("Attendance record not found or access denied");
    }

    private AttendanceDTO mapAttendanceToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setAttendanceId(attendance.getAttendanceId());
        dto.setStudentId(attendance.getStudent().getUserId());
        dto.setStudentName(attendance.getStudent().getFullName());
        dto.setCourseId(attendance.getCourse().getCourseId());
        dto.setCourseName(attendance.getCourse().getCourseName());
        dto.setTeacherId(attendance.getTeacher().getUserId());
        dto.setTeacherName(attendance.getTeacher().getFullName());
        dto.setClassDate(attendance.getClassDate());
        dto.setStatus(attendance.getStatus().name());
        dto.setRemarks(attendance.getRemarks());
        dto.setCreatedAt(attendance.getCreatedAt());
        dto.setUpdatedAt(attendance.getUpdatedAt());
        return dto;
    }

    // ========== EXAM SUBMISSION CRUD ==========

    public List<ExamSubmissionDTO> getMyExamSubmissions() {
        User currentUser = authService.getUser();
        return examSubmissionRepository.findByStudentUserId(currentUser.getUserId()).stream()
                .map(this::mapExamSubmissionToDTO)
                .collect(Collectors.toList());
    }

    public List<ExamSubmissionDTO> getMyExamSubmissionsByCourse(Integer courseId) {
        User currentUser = authService.getUser();
        return examSubmissionRepository.findByStudentUserIdAndCourseCourseId(
                currentUser.getUserId(), courseId).stream()
                .map(this::mapExamSubmissionToDTO)
                .collect(Collectors.toList());
    }

    public ExamSubmissionDTO getExamSubmissionById(Integer submissionId) {
        User currentUser = authService.getUser();
        Optional<ExamSubmission> submission = examSubmissionRepository.findById(submissionId);
        
        if (submission.isPresent() && submission.get().getStudent().getUserId().equals(currentUser.getUserId())) {
            return mapExamSubmissionToDTO(submission.get());
        }
        throw new RuntimeException("Exam submission not found or access denied");
    }

    @Transactional
    public ExamSubmissionDTO createExamSubmission(MultipartFile file, Integer courseId, String submittedNotes) {
        User currentUser = authService.getUser();

        // Get course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Get teacher from assignment
        List<StudentTeacherAssignment> assignments = assignmentRepository
                .findByStudentUserIdAndCourseCourseIdAndStatus(
                        currentUser.getUserId(),
                        courseId,
                        StudentTeacherAssignment.AssignmentStatus.active);

        if (assignments.isEmpty()) {
            throw new RuntimeException("No active assignment found for this course");
        }

        User teacher = assignments.get(0).getTeacher();

        // Save file to local directory
        String fileName = saveUploadedFile(file);

        // Create exam submission
        ExamSubmission submission = new ExamSubmission();
        submission.setStudent(currentUser);
        submission.setCourse(course);
        submission.setTeacher(teacher);
        submission.setFileName(file.getOriginalFilename());
        submission.setFileUrl(fileName); // This will be the relative path
        submission.setFileSize(file.getSize());
        submission.setMimeType(file.getContentType());
        submission.setSubmittedNotes(submittedNotes);
        submission.setStatus(ExamSubmission.SubmissionStatus.Pending);
        submission.setSubmittedOn(LocalDateTime.now());

        ExamSubmission saved = examSubmissionRepository.save(submission);
        return mapExamSubmissionToDTO(saved);
    }

    private String saveUploadedFile(MultipartFile file) {
        try {
            // Generate unique filename to avoid conflicts
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Create full path
            Path uploadPath = Paths.get(fileUploadConfig.getUploadDir());
            Path filePath = uploadPath.resolve(uniqueFileName);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return uniqueFileName; // Return relative path for database storage
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded file", e);
        }
    }

    @Transactional
    public ExamSubmissionDTO updateExamSubmission(Integer submissionId, ExamSubmissionRequestDTO requestDTO) {
        User currentUser = authService.getUser();
        ExamSubmission submission = examSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Exam submission not found"));
        
        // Verify ownership
        if (!submission.getStudent().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied: You can only update your own submissions");
        }
        
        // Only allow updates if status is Pending
        if (submission.getStatus() != ExamSubmission.SubmissionStatus.Pending) {
            throw new RuntimeException("Cannot update submission that has been graded");
        }
        
        // Update fields
        if (requestDTO.getFileName() != null) {
            submission.setFileName(requestDTO.getFileName());
        }
        if (requestDTO.getFileUrl() != null) {
            submission.setFileUrl(requestDTO.getFileUrl());
        }
        if (requestDTO.getFileSize() != null) {
            submission.setFileSize(requestDTO.getFileSize());
        }
        if (requestDTO.getMimeType() != null) {
            submission.setMimeType(requestDTO.getMimeType());
        }
        if (requestDTO.getSubmittedNotes() != null) {
            submission.setSubmittedNotes(requestDTO.getSubmittedNotes());
        }
        
        ExamSubmission updated = examSubmissionRepository.save(submission);
        return mapExamSubmissionToDTO(updated);
    }

    @Transactional
    public void deleteExamSubmission(Integer submissionId) {
        User currentUser = authService.getUser();
        ExamSubmission submission = examSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Exam submission not found"));
        
        // Verify ownership
        if (!submission.getStudent().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied: You can only delete your own submissions");
        }
        
        // Only allow deletion if status is Pending
        if (submission.getStatus() != ExamSubmission.SubmissionStatus.Pending) {
            throw new RuntimeException("Cannot delete submission that has been graded");
        }
        
        examSubmissionRepository.delete(submission);
    }

    private ExamSubmissionDTO mapExamSubmissionToDTO(ExamSubmission submission) {
        ExamSubmissionDTO dto = new ExamSubmissionDTO();
        dto.setSubmissionId(submission.getSubmissionId());
        dto.setStudentId(submission.getStudent().getUserId());
        dto.setStudentName(submission.getStudent().getFullName());
        dto.setCourseId(submission.getCourse().getCourseId());
        dto.setCourseName(submission.getCourse().getCourseName());
        dto.setTeacherId(submission.getTeacher().getUserId());
        dto.setTeacherName(submission.getTeacher().getFullName());
        dto.setFileName(submission.getFileName());
        dto.setFileUrl(submission.getFileUrl());
        dto.setFileSize(submission.getFileSize());
        dto.setMimeType(submission.getMimeType());
        dto.setStatus(submission.getStatus().name());
        dto.setGrade(submission.getGrade());
        dto.setTotalQuestions(submission.getTotalQuestions());
        dto.setCorrectAnswers(submission.getCorrectAnswers());
        dto.setWrongAnswers(submission.getWrongAnswers());
        dto.setRemarks(submission.getRemarks());
        dto.setSubmittedNotes(submission.getSubmittedNotes());
        dto.setSubmittedOn(submission.getSubmittedOn());
        dto.setUpdatedAt(submission.getUpdatedAt());
        dto.setGradedAt(submission.getGradedAt());
        return dto;
    }

    // ========== COURSE LEVELS ==========

    public List<CourseLevelDTO> getCourseLevels(Integer courseId) {
        User currentUser = authService.getUser();
        
        // Verify student is enrolled in this course
        List<StudentTeacherAssignment> assignments = assignmentRepository
                .findByStudentUserIdAndCourseCourseIdAndStatus(
                        currentUser.getUserId(), 
                        courseId,
                        StudentTeacherAssignment.AssignmentStatus.active);
        
        if (assignments.isEmpty()) {
            throw new RuntimeException("You are not enrolled in this course");
        }
        
        // Get levels for the course
        return levelRepository.findByCourseCourseId(courseId).stream()
                .map(this::mapLevelToDTO)
                .collect(Collectors.toList());
    }

    private CourseLevelDTO mapLevelToDTO(CourseLevel level) {
        CourseLevelDTO dto = new CourseLevelDTO();
        dto.setLevelId(level.getLevelId());
        dto.setCourseId(level.getCourse().getCourseId());
        dto.setLevelNumber(level.getLevelNumber());
        dto.setLevelName(level.getLevelName());
        dto.setObjectives(level.getObjectives());
        dto.setDurationWeeks(level.getDurationWeeks());
        return dto;
    }

    // ========== CERTIFICATES ==========

    public List<CertificateDTO> getMyCertificates() {
        User currentUser = authService.getUser();
        return certificateRepository.findByStudentUserId(currentUser.getUserId()).stream()
                .map(this::mapCertificateToDTO)
                .collect(Collectors.toList());
    }

    public List<CertificateDTO> getMyCertificatesByCourse(Integer courseId) {
        User currentUser = authService.getUser();
        return certificateRepository.findByStudentUserIdAndCourseCourseId(currentUser.getUserId(), courseId).stream()
                .map(this::mapCertificateToDTO)
                .collect(Collectors.toList());
    }

    public CertificateDTO getCertificateById(Integer certificateId) {
        User currentUser = authService.getUser();
        Optional<Certificate> certificate = certificateRepository.findById(certificateId);
        
        if (certificate.isPresent() && certificate.get().getStudent().getUserId().equals(currentUser.getUserId())) {
            return mapCertificateToDTO(certificate.get());
        }
        throw new RuntimeException("Certificate not found or access denied");
    }

    private CertificateDTO mapCertificateToDTO(Certificate certificate) {
        CertificateDTO dto = new CertificateDTO();
        dto.setCertificateId(certificate.getCertificateId());
        dto.setStudentId(certificate.getStudent().getUserId());
        dto.setStudentName(certificate.getStudent().getFullName());
        dto.setCourseId(certificate.getCourse().getCourseId());
        dto.setCourseName(certificate.getCourse().getCourseName());
        dto.setVerificationCode(certificate.getVerificationCode());
        dto.setDownloadUrl(certificate.getDownloadUrl());
        dto.setIssuedDate(certificate.getIssuedDate());
        return dto;
    }
}

