package com.example.TVM.repository;

import com.example.TVM.entity.LevelActivity;
import com.example.TVM.entity.LevelActivitySubmission;
import com.example.TVM.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LevelActivitySubmissionRepository extends JpaRepository<LevelActivitySubmission, Integer> {
    List<LevelActivitySubmission> findByStudentUserIdAndActivityLevelLevelId(Integer studentId, Integer levelId);
    Optional<LevelActivitySubmission> findByStudentAndActivity(User student, LevelActivity activity);
    List<LevelActivitySubmission> findByStudentUserIdAndActivityActivityIdOrderByAttemptNumberDesc(Integer studentId, Integer activityId);
    Optional<LevelActivitySubmission> findTopByStudentUserIdAndActivityActivityIdOrderBySubmittedAtDesc(Integer studentId, Integer activityId);
    Integer countByStudentUserIdAndActivityActivityId(Integer studentId, Integer activityId);
}
