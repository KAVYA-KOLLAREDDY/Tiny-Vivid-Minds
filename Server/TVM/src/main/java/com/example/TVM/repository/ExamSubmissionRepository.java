package com.example.TVM.repository;

import com.example.TVM.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Integer> {
    // Find submissions by student
    List<ExamSubmission> findByStudentUserId(Integer studentId);
    
    // Find submissions by student and course
    List<ExamSubmission> findByStudentUserIdAndCourseCourseId(Integer studentId, Integer courseId);
    
    // Find submissions by teacher
    List<ExamSubmission> findByTeacherUserId(Integer teacherId);

    // Find submissions by teacher and course
    List<ExamSubmission> findByTeacherUserIdAndCourseCourseId(Integer teacherId, Integer courseId);

    // Find submissions by course
    List<ExamSubmission> findByCourseCourseId(Integer courseId);
    
    // Find submissions by status
    List<ExamSubmission> findByStatus(ExamSubmission.SubmissionStatus status);
    
    // Find submissions by student and status
    List<ExamSubmission> findByStudentUserIdAndStatus(
            Integer studentId, ExamSubmission.SubmissionStatus status);
}

