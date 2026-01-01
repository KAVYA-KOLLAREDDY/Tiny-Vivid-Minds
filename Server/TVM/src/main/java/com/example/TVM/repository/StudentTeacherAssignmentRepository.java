package com.example.TVM.repository;

import com.example.TVM.entity.StudentTeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentTeacherAssignmentRepository extends JpaRepository<StudentTeacherAssignment, Integer> {
    List<StudentTeacherAssignment> findByTeacherUserId(Integer teacherId);
    List<StudentTeacherAssignment> findByStudentUserId(Integer studentId);
    List<StudentTeacherAssignment> findByTeacherUserIdAndStatus(Integer teacherId, StudentTeacherAssignment.AssignmentStatus status);
    List<StudentTeacherAssignment> findByStudentUserIdAndStatus(Integer studentId, StudentTeacherAssignment.AssignmentStatus status);
    List<StudentTeacherAssignment> findByStudentUserIdAndCourseCourseIdAndStatus(
            Integer studentId, Integer courseId, StudentTeacherAssignment.AssignmentStatus status);
}

