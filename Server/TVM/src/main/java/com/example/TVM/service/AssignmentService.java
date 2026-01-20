package com.example.TVM.service;

import com.example.TVM.dto.StudentAssignmentDTO;
import com.example.TVM.dto.TeacherCourseAssignmentDTO;
import com.example.TVM.entity.*;
import com.example.TVM.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final TeacherCourseAssignmentRepository teacherCourseAssignmentRepository;

    @Transactional
    public StudentAssignmentDTO assignStudentToTeacher(StudentAssignmentDTO dto) {
        User student = userRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        User teacher = userRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if teacher is assigned to this course
        if (!teacherCourseAssignmentRepository.existsByTeacherUserIdAndCourseCourseId(
                teacher.getUserId(), course.getCourseId())) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        StudentTeacherAssignment assignment = new StudentTeacherAssignment();
        assignment.setStudent(student);
        assignment.setTeacher(teacher);
        assignment.setCourse(course);
        assignment.setStartDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now());
        assignment.setPreferredTime(dto.getPreferredTime());
        assignment.setDurationMinutes(dto.getDurationMinutes());
        assignment.setEndDate(dto.getEndDate());
        assignment.setStatus(StudentTeacherAssignment.AssignmentStatus.active);

        assignment = assignmentRepository.save(assignment);
        return mapToDTO(assignment);
    }

    @Transactional
    public StudentAssignmentDTO assignTeacherToCourse(Integer teacherId, Integer courseId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (teacherCourseAssignmentRepository.existsByTeacherUserIdAndCourseCourseId(teacherId, courseId)) {
            throw new RuntimeException("Teacher is already assigned to this course");
        }

        TeacherCourseAssignment assignment = new TeacherCourseAssignment();
        assignment.setTeacher(teacher);
        assignment.setCourse(course);
        assignment = teacherCourseAssignmentRepository.save(assignment);

        // Return a DTO - we'll create a simple one
        StudentAssignmentDTO result = new StudentAssignmentDTO();
        result.setTeacherId(teacherId);
        result.setCourseId(courseId);
        return result;
    }

    public List<TeacherCourseAssignmentDTO> getAllTeacherCourseAssignments() {
        List<TeacherCourseAssignment> assignments = teacherCourseAssignmentRepository.findAll();
        return assignments.stream()
                .map(this::mapToTeacherCourseDTO)
                .collect(Collectors.toList());
    }

    public List<StudentAssignmentDTO> getAllStudentTeacherAssignments() {
        List<StudentTeacherAssignment> assignments = assignmentRepository.findAll();
        return assignments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private TeacherCourseAssignmentDTO mapToTeacherCourseDTO(TeacherCourseAssignment assignment) {
        TeacherCourseAssignmentDTO dto = new TeacherCourseAssignmentDTO();
        dto.setAssignmentId(assignment.getAssignmentId());
        dto.setTeacherId(assignment.getTeacher().getUserId());
        dto.setTeacherName(assignment.getTeacher().getFullName());
        dto.setTeacherEmail(assignment.getTeacher().getEmail());
        dto.setCourseId(assignment.getCourse().getCourseId());
        dto.setCourseName(assignment.getCourse().getCourseName());
        dto.setAssignedAt(assignment.getAssignedAt());
        return dto;
    }

    private StudentAssignmentDTO mapToDTO(StudentTeacherAssignment assignment) {
        StudentAssignmentDTO dto = new StudentAssignmentDTO();
        dto.setAssignmentId(assignment.getAssignmentId());
        dto.setStudentId(assignment.getStudent().getUserId());
        dto.setTeacherId(assignment.getTeacher().getUserId());
        dto.setCourseId(assignment.getCourse().getCourseId());
        dto.setStartDate(assignment.getStartDate());
        dto.setPreferredTime(assignment.getPreferredTime());
        dto.setDurationMinutes(assignment.getDurationMinutes());
        dto.setEndDate(assignment.getEndDate());
        dto.setStatus(assignment.getStatus().name());
        return dto;
    }
}

