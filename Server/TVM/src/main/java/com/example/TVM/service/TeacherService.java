package com.example.TVM.service;

import com.example.TVM.dto.*;
import com.example.TVM.entity.*;
import com.example.TVM.repository.*;
import com.example.TVM.entity.ExamSubmission.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherService {
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final ClassScheduleRepository scheduleRepository;
    private final StudentProgressRepository progressRepository;
    private final CourseLevelRepository levelRepository;
    private final TeacherCourseAssignmentRepository teacherCourseAssignmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamSubmissionRepository examSubmissionRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AuthService authService;

    public List<StudentAssignmentDTO> getMyStudents() {
        User currentUser = authService.getUser();
        return assignmentRepository.findByTeacherUserId(currentUser.getUserId()).stream()
                .map(this::mapAssignmentToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getAllMyStudents() {
        User currentUser = authService.getUser();
        // Get all students assigned to courses taught by this teacher
        List<Integer> studentIds = assignmentRepository.findByTeacherUserId(currentUser.getUserId())
                .stream()
                .map(StudentTeacherAssignment::getStudent)
                .map(User::getUserId)
                .distinct()
                .collect(Collectors.toList());

        return studentIds.stream()
                .map(studentId -> userRepository.findById(studentId).orElse(null))
                .filter(Objects::nonNull)
                .map(this::mapUserToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO mapUserToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        return dto;
    }

    public List<ClassScheduleDTO> getMyCalendar(LocalDateTime start, LocalDateTime end) {
        User currentUser = authService.getUser();
        return scheduleRepository.findByAssignmentTeacherUserIdAndScheduledDateBetween(
                currentUser.getUserId(), start, end).stream()
                .map(this::mapScheduleToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<StudentProgressDTO> getStudentProgress(Integer studentId, Integer courseId) {
        List<StudentProgress> progressList = progressRepository
                .findByStudentUserIdAndCourseCourseId(studentId, courseId);
        return progressList.stream()
                .map(this::mapProgressToDTO)
                .collect(Collectors.toList());
    }

    public StudentProgressDTO getStudentLevelProgress(Integer studentId, Integer courseId, Integer levelId) {
        StudentProgress progress = progressRepository
                .findByStudentUserIdAndCourseCourseIdAndLevelLevelId(studentId, courseId, levelId)
                .orElseThrow(() -> new RuntimeException("Progress not found"));
        return mapProgressToDTO(progress);
    }

    public StudentProgressDTO updateStudentLevel(Integer studentId, Integer courseId, Integer levelId, String status, String remarks) {
        StudentProgress progress = progressRepository
                .findByStudentUserIdAndCourseCourseIdAndLevelLevelId(studentId, courseId, levelId)
                .orElseGet(() -> {
                    StudentProgress newProgress = new StudentProgress();
                    newProgress.setStudent(userRepository.findById(studentId)
                            .orElseThrow(() -> new RuntimeException("Student not found")));
                    newProgress.setCourse(courseRepository.findById(courseId)
                            .orElseThrow(() -> new RuntimeException("Course not found")));
                    newProgress.setLevel(levelRepository.findById(levelId)
                            .orElseThrow(() -> new RuntimeException("Level not found")));
                    return newProgress;
                });

        // Convert status to enum format (not_started, in_progress, completed)
        String enumStatus = status.toLowerCase().replace(" ", "_");
        progress.setProgressStatus(StudentProgress.ProgressStatus.valueOf(enumStatus));
        if (enumStatus.equals("completed")) {
            progress.setCompletionDate(java.time.LocalDate.now());
        }
        progress.setRemarks(remarks);
        progress = progressRepository.save(progress);
        return mapProgressToDTO(progress);
    }

    // ========== ATTENDANCE (Teacher) ==========

    public List<AttendanceDTO> getMyAttendance(LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getUser();
        return attendanceRepository
                .findByTeacherUserIdAndClassDateBetween(currentUser.getUserId(), startDate, endDate)
                .stream()
                .map(this::mapAttendanceToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceDTO upsertAttendance(AttendanceRequestDTO request) {
        User currentUser = authService.getUser();

        LocalDate classDate = request.getClassDate() != null
                ? request.getClassDate()
                : LocalDate.now();

        // Either update existing attendance for same student/course/date, or create new
        Attendance attendance = attendanceRepository
                .findByStudentUserIdAndCourseCourseIdAndClassDate(
                        request.getStudentId(), request.getCourseId(), classDate)
                .orElseGet(() -> {
                    Attendance a = new Attendance();
                    a.setStudent(userRepository.findById(request.getStudentId())
                            .orElseThrow(() -> new RuntimeException("Student not found")));
                    a.setCourse(courseRepository.findById(request.getCourseId())
                            .orElseThrow(() -> new RuntimeException("Course not found")));
                    a.setTeacher(currentUser);
                    a.setClassDate(classDate);
                    return a;
                });

        // Normalize and set status
        String status = request.getStatus() != null ? request.getStatus() : "Present";
        Attendance.AttendanceStatus enumStatus = Attendance.AttendanceStatus.valueOf(status);
        attendance.setStatus(enumStatus);
        attendance.setRemarks(request.getRemarks());

        Attendance saved = attendanceRepository.save(attendance);
        return mapAttendanceToDTO(saved);
    }

    @Transactional
    public AttendanceDTO updateAttendance(Integer attendanceId, AttendanceRequestDTO request) {
        User currentUser = authService.getUser();
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));

        // Ensure this attendance belongs to the current teacher
        if (!attendance.getTeacher().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied to update this attendance record");
        }

        if (request.getClassDate() != null) {
            attendance.setClassDate(request.getClassDate());
        }
        if (request.getStatus() != null) {
            attendance.setStatus(Attendance.AttendanceStatus.valueOf(request.getStatus()));
        }
        if (request.getRemarks() != null) {
            attendance.setRemarks(request.getRemarks());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapAttendanceToDTO(saved);
    }

    @Transactional
    public void deleteAttendance(Integer attendanceId) {
        User currentUser = authService.getUser();
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));

        if (!attendance.getTeacher().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied to delete this attendance record");
        }

        attendanceRepository.delete(attendance);
    }

    public List<StudentProgressDTO> getStudentProgress(Integer studentId) {
        return progressRepository.findByStudentUserId(studentId).stream()
                .map(this::mapProgressToDTO)
                .collect(Collectors.toList());
    }

    public List<CourseLevelDTO> getCourseLevels(Integer courseId) {
        // Verify that the teacher is assigned to this course
        User currentUser = authService.getUser();
        if (!teacherCourseAssignmentRepository.existsByTeacherUserIdAndCourseCourseId(
                currentUser.getUserId(), courseId)) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }
        
        // Return levels for the course
        return levelRepository.findByCourseCourseIdOrderByLevelNumberAsc(courseId).stream()
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

    private StudentAssignmentDTO mapAssignmentToDTO(StudentTeacherAssignment assignment) {
        StudentAssignmentDTO dto = new StudentAssignmentDTO();
        dto.setAssignmentId(assignment.getAssignmentId());
        dto.setStudentId(assignment.getStudent().getUserId());
        dto.setTeacherId(assignment.getTeacher().getUserId());
        dto.setCourseId(assignment.getCourse().getCourseId());
        dto.setStartDate(assignment.getStartDate());
        dto.setPreferredTime(assignment.getPreferredTime());
        dto.setStatus(assignment.getStatus().name());
        return dto;
    }

    private ClassScheduleDTO mapScheduleToDTO(ClassSchedule schedule) {
        ClassScheduleDTO dto = new ClassScheduleDTO();
        dto.setClassId(schedule.getClassId());
        dto.setAssignmentId(schedule.getAssignment().getAssignmentId());
        dto.setScheduledDate(schedule.getScheduledDate());
        dto.setDurationMinutes(schedule.getDurationMinutes());
        dto.setTopic(schedule.getTopic());
        dto.setLevelId(schedule.getLevel() != null ? schedule.getLevel().getLevelId() : null);
        dto.setStatus(schedule.getStatus().name());
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

    // ========== EXAM SUBMISSION GRADING ==========

    public List<ExamSubmissionDTO> getMyExamSubmissions() {
        User currentUser = authService.getUser();
        return examSubmissionRepository.findByTeacherUserId(currentUser.getUserId()).stream()
                .map(this::mapExamSubmissionToDTO)
                .collect(Collectors.toList());
    }

    public List<ExamSubmissionDTO> getMyExamSubmissionsByCourse(Integer courseId) {
        User currentUser = authService.getUser();
        return examSubmissionRepository.findByTeacherUserIdAndCourseCourseId(currentUser.getUserId(), courseId).stream()
                .map(this::mapExamSubmissionToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExamSubmissionDTO gradeExamSubmission(Integer submissionId, GradeSubmissionDTO gradeDTO) {
        User currentUser = authService.getUser();
        ExamSubmission submission = examSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Exam submission not found"));

        // Verify ownership
        if (!submission.getTeacher().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied: You can only grade your students' submissions");
        }

        // Update grading information
        submission.setGrade(gradeDTO.getGrade());
        submission.setTotalQuestions(gradeDTO.getTotalQuestions());
        submission.setCorrectAnswers(gradeDTO.getCorrectAnswers());
        submission.setWrongAnswers(gradeDTO.getWrongAnswers());
        submission.setRemarks(gradeDTO.getRemarks());
        submission.setStatus(SubmissionStatus.valueOf(gradeDTO.getStatus()));
        submission.setGradedAt(java.time.LocalDateTime.now());

        ExamSubmission saved = examSubmissionRepository.save(submission);
        return mapExamSubmissionToDTO(saved);
    }

    @Transactional
    public ExamSubmissionDTO updateExamSubmissionStatus(Integer submissionId, String status) {
        User currentUser = authService.getUser();
        ExamSubmission submission = examSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Exam submission not found"));

        // Verify ownership
        if (!submission.getTeacher().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied: You can only update your students' submissions");
        }

        // Update status
        SubmissionStatus enumStatus = SubmissionStatus.valueOf(status);
        submission.setStatus(enumStatus);

        // If approving or rejecting, set graded timestamp
        if (enumStatus == SubmissionStatus.Approved || enumStatus == SubmissionStatus.Rejected) {
            submission.setGradedAt(java.time.LocalDateTime.now());
        }

        ExamSubmission saved = examSubmissionRepository.save(submission);
        return mapExamSubmissionToDTO(saved);
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

}

