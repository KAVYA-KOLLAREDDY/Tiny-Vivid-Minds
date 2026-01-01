package com.example.TVM.repository;

import com.example.TVM.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
    // Find attendance by student
    List<Attendance> findByStudentUserId(Integer studentId);
    
    // Find attendance by student and course
    List<Attendance> findByStudentUserIdAndCourseCourseId(Integer studentId, Integer courseId);
    
    // Find attendance by student, course, and date
    Optional<Attendance> findByStudentUserIdAndCourseCourseIdAndClassDate(
            Integer studentId, Integer courseId, LocalDate classDate);
    
    // Find attendance by teacher
    List<Attendance> findByTeacherUserId(Integer teacherId);
    
    // Find attendance by course
    List<Attendance> findByCourseCourseId(Integer courseId);
    
    // Find attendance by date range for a student
    List<Attendance> findByStudentUserIdAndClassDateBetween(
            Integer studentId, LocalDate startDate, LocalDate endDate);

    // Find attendance by teacher and date range
    List<Attendance> findByTeacherUserIdAndClassDateBetween(
            Integer teacherId, LocalDate startDate, LocalDate endDate);
}

