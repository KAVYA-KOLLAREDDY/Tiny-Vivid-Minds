package com.example.TVM.repository;

import com.example.TVM.entity.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, Integer> {
    List<StudentProgress> findByStudentUserId(Integer studentId);
    List<StudentProgress> findByStudentUserIdAndCourseCourseId(Integer studentId, Integer courseId);
    Optional<StudentProgress> findByStudentUserIdAndCourseCourseIdAndLevelLevelId(
            Integer studentId, Integer courseId, Integer levelId);
}

