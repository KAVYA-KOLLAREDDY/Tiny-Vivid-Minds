package com.example.TVM.repository;

import com.example.TVM.entity.TeacherCourseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherCourseAssignmentRepository extends JpaRepository<TeacherCourseAssignment, Integer> {
    List<TeacherCourseAssignment> findByTeacherUserId(Integer teacherId);
    List<TeacherCourseAssignment> findByCourseCourseId(Integer courseId);
    Optional<TeacherCourseAssignment> findByTeacherUserIdAndCourseCourseId(Integer teacherId, Integer courseId);
    boolean existsByTeacherUserIdAndCourseCourseId(Integer teacherId, Integer courseId);
}

