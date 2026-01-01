package com.example.TVM.service;

import com.example.TVM.dto.LevelActivityDTO;
import com.example.TVM.dto.LevelActivitySubmissionDTO;
import com.example.TVM.dto.LevelContentDTO;
import com.example.TVM.entity.*;
import com.example.TVM.repository.LevelActivityRepository;
import com.example.TVM.repository.LevelActivitySubmissionRepository;
import com.example.TVM.repository.LevelContentRepository;
import com.example.TVM.repository.StudentProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LevelLearningService {

    private final LevelContentRepository levelContentRepository;
    private final LevelActivityRepository levelActivityRepository;
    private final LevelActivitySubmissionRepository submissionRepository;
    private final StudentProgressRepository studentProgressRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }

    public List<LevelContentDTO> getLevelContent(Integer levelId) {
        return levelContentRepository.findByLevelLevelIdOrderByContentOrderAsc(levelId)
                .stream()
                .map(this::mapToContentDTO)
                .collect(Collectors.toList());
    }

    public List<LevelActivityDTO> getLevelActivities(Integer levelId) {
        return levelActivityRepository.findByLevelLevelId(levelId)
                .stream()
                .map(this::mapToActivityDTO)
                .collect(Collectors.toList());
    }

    public List<LevelActivitySubmissionDTO> getMyActivitySubmissionsForLevel(Integer levelId) {
        User currentUser = getCurrentUser();
        return submissionRepository.findByStudentUserIdAndActivityLevelLevelId(currentUser.getUserId(), levelId)
                .stream()
                .map(this::mapToSubmissionDTO)
                .collect(Collectors.toList());
    }

    public LevelActivitySubmissionDTO getMyLatestSubmissionForActivity(Integer activityId) {
        User currentUser = getCurrentUser();
        Optional<LevelActivitySubmission> submission = submissionRepository
                .findTopByStudentUserIdAndActivityActivityIdOrderBySubmittedAtDesc(currentUser.getUserId(), activityId);

        return submission.map(this::mapToSubmissionDTO).orElse(null);
    }

    @Transactional
    public LevelActivitySubmissionDTO submitActivity(
            Integer activityId,
            String answers,
            String submissionContent,
            Integer timeTakenMinutes) {

        User currentUser = getCurrentUser();
        LevelActivity activity = levelActivityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Check if student has exceeded max attempts
        Integer attemptCount = submissionRepository.countByStudentUserIdAndActivityActivityId(
                currentUser.getUserId(), activityId);

        if (attemptCount >= activity.getMaxAttempts()) {
            throw new RuntimeException("Maximum attempts exceeded for this activity");
        }

        // Check if time limit exceeded
        if (activity.getTimeLimitMinutes() != null && timeTakenMinutes > activity.getTimeLimitMinutes()) {
            throw new RuntimeException("Time limit exceeded");
        }

        LevelActivitySubmission submission = new LevelActivitySubmission();
        submission.setStudent(currentUser);
        submission.setActivity(activity);
        submission.setAttemptNumber(attemptCount + 1);
        submission.setAnswers(answers);
        submission.setSubmissionContent(submissionContent);
        submission.setStatus(LevelActivitySubmission.SubmissionStatus.SUBMITTED);
        submission.setTimeTakenMinutes(timeTakenMinutes);
        submission.setSubmittedAt(LocalDateTime.now());

        LevelActivitySubmission saved = submissionRepository.save(submission);
        return mapToSubmissionDTO(saved);
    }

    public boolean canCompleteLevel(Integer levelId) {
        User currentUser = getCurrentUser();

        // Get all required activities for this level
        List<LevelActivity> requiredActivities = levelActivityRepository
                .findByLevelLevelIdAndIsRequiredTrue(levelId);

        // Check if all required activities are completed/passed
        for (LevelActivity activity : requiredActivities) {
            Optional<LevelActivitySubmission> latestSubmission = submissionRepository
                    .findTopByStudentUserIdAndActivityActivityIdOrderBySubmittedAtDesc(
                            currentUser.getUserId(), activity.getActivityId());

            if (latestSubmission.isEmpty() || !latestSubmission.get().isPassed()) {
                return false;
            }
        }

        // Get all required content for this level
        // List<LevelContent> requiredContent = levelContentRepository
        //         .findByLevelLevelIdAndIsRequiredTrue(levelId);

        // For now, assume content is always accessible
        // In a real implementation, you might track content view completion

        return true;
    }

    @Transactional
    public void completeLevel(Integer levelId) {
        User currentUser = getCurrentUser();

        if (!canCompleteLevel(levelId)) {
            throw new RuntimeException("Cannot complete level - requirements not met");
        }

        // Update or create student progress
        Optional<StudentProgress> existingProgress = studentProgressRepository
                .findByStudentUserIdAndLevelLevelId(currentUser.getUserId(), levelId);

        if (existingProgress.isPresent()) {
            StudentProgress progress = existingProgress.get();
            progress.setProgressStatus(StudentProgress.ProgressStatus.completed);
            progress.setCompletionDate(java.time.LocalDate.now());
            studentProgressRepository.save(progress);
        } else {
            // This shouldn't happen if the student was properly enrolled
            throw new RuntimeException("Student progress record not found");
        }
    }

    private LevelContentDTO mapToContentDTO(LevelContent content) {
        return new LevelContentDTO(
                content.getContentId(),
                content.getLevel().getLevelId(),
                content.getContentType().name(),
                content.getTitle(),
                content.getDescription(),
                content.getContent(),
                content.getContentOrder(),
                content.getIsRequired(),
                content.getEstimatedMinutes(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }

    private LevelActivityDTO mapToActivityDTO(LevelActivity activity) {
        return new LevelActivityDTO(
                activity.getActivityId(),
                activity.getLevel().getLevelId(),
                activity.getActivityType().name(),
                activity.getTitle(),
                activity.getDescription(),
                activity.getInstructions(),
                activity.getContent(),
                activity.getPassingScore(),
                activity.getMaxAttempts(),
                activity.getTimeLimitMinutes(),
                activity.getIsRequired(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }

    private LevelActivitySubmissionDTO mapToSubmissionDTO(LevelActivitySubmission submission) {
        return new LevelActivitySubmissionDTO(
                submission.getSubmissionId(),
                submission.getStudent().getUserId(),
                submission.getActivity().getActivityId(),
                submission.getAttemptNumber(),
                submission.getAnswers(),
                submission.getSubmissionContent(),
                submission.getScore(),
                submission.getMaxScore(),
                submission.getPercentage(),
                submission.getStatus().name(),
                submission.getTimeTakenMinutes(),
                submission.getFeedback(),
                submission.getSubmittedAt(),
                submission.getGradedAt(),
                submission.getUpdatedAt(),
                submission.isPassed()
        );
    }
}