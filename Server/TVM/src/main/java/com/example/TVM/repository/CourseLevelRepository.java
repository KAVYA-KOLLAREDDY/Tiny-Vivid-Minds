package com.example.TVM.repository;

import com.example.TVM.entity.CourseLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseLevelRepository extends JpaRepository<CourseLevel, Integer> {
    List<CourseLevel> findByCourseCourseId(Integer courseId);
    List<CourseLevel> findByCourseCourseIdOrderByLevelNumberAsc(Integer courseId);
}

