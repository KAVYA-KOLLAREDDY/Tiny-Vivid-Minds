package com.example.TVM.repository;

import com.example.TVM.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Integer> {
    List<ClassSchedule> findByAssignmentAssignmentId(Integer assignmentId);
    List<ClassSchedule> findByAssignmentTeacherUserIdAndScheduledDateBetween(
            Integer teacherId, LocalDateTime start, LocalDateTime end);
    List<ClassSchedule> findByAssignmentStudentUserIdAndScheduledDateBetween(
            Integer studentId, LocalDateTime start, LocalDateTime end);
}

