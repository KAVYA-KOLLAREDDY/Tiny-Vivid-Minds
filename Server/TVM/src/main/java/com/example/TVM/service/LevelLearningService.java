package com.example.TVM.service;

import com.example.TVM.dto.LevelActivityDTO;
import com.example.TVM.dto.LevelActivitySubmissionDTO;
import com.example.TVM.dto.LevelContentDTO;
import com.example.TVM.entity.*;
import com.example.TVM.repository.*;
import lombok.RequiredArgsConstructor;
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
    private final StudentProgressRepository progressRepository;
    private final CourseLevelRepository courseLevelRepository;
    private final AuthService authService;

    // ========== LEVEL CONTENT METHODS ==========

    public List<LevelContentDTO> getLevelContent(Integer levelId) {
        return levelContentRepository.findByLevelLevelIdOrderByContentOrderAsc(levelId)
                .stream()
                .map(this::mapContentToDTO)
                .collect(Collectors.toList());
    }

    public LevelContentDTO getContentById(Integer contentId) {
        LevelContent content = levelContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));
        return mapContentToDTO(content);
    }

    // ========== LEVEL ACTIVITIES METHODS ==========

    public List<LevelActivityDTO> getLevelActivities(Integer levelId) {
        return levelActivityRepository.findByLevelLevelId(levelId)
                .stream()
                .map(this::mapActivityToDTO)
                .collect(Collectors.toList());
    }

    public LevelActivityDTO getActivityById(Integer activityId) {
        LevelActivity activity = levelActivityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        return mapActivityToDTO(activity);
    }

    // ========== ACTIVITY SUBMISSIONS METHODS ==========

    public List<LevelActivitySubmissionDTO> getMyActivitySubmissionsForLevel(Integer levelId) {
        User currentUser = authService.getUser();
        return submissionRepository.findByStudentUserIdAndActivityLevelLevelId(currentUser.getUserId(), levelId)
                .stream()
                .map(this::mapSubmissionToDTO)
                .collect(Collectors.toList());
    }

    public LevelActivitySubmissionDTO getMyLatestSubmissionForActivity(Integer activityId) {
        User currentUser = authService.getUser();
        List<LevelActivitySubmission> submissions = submissionRepository
                .findByStudentUserIdAndActivityActivityIdOrderByAttemptNumberDesc(currentUser.getUserId(), activityId);

        if (submissions.isEmpty()) {
            return null;
        }

        return mapSubmissionToDTO(submissions.get(0));
    }

    @Transactional
    public LevelActivitySubmissionDTO submitActivity(Integer activityId, String answers, String submissionContent) {
        User currentUser = authService.getUser();
        LevelActivity activity = levelActivityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        // Check if student has access to this activity (enrolled in course)
        validateStudentAccess(activity.getLevel().getCourse().getCourseId());

        // Get attempt number
        List<LevelActivitySubmission> existingSubmissions = submissionRepository
                .findByStudentUserIdAndActivityActivityIdOrderByAttemptNumberDesc(
                        currentUser.getUserId(), activityId);

        int attemptNumber = existingSubmissions.isEmpty() ? 1 : existingSubmissions.get(0).getAttemptNumber() + 1;

        // Check max attempts
        if (activity.getMaxAttempts() != null && attemptNumber > activity.getMaxAttempts()) {
            throw new RuntimeException("Maximum attempts exceeded for this activity");
        }

        LevelActivitySubmission submission = new LevelActivitySubmission();
        submission.setStudent(currentUser);
        submission.setActivity(activity);
        submission.setAttemptNumber(attemptNumber);
        submission.setAnswers(answers);
        submission.setSubmissionContent(submissionContent);
        submission.setStatus(LevelActivitySubmission.SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());

        // Auto-grade simple activities or set for manual grading
        if (activity.getActivityType() == LevelActivity.ActivityType.QUIZ) {
            autoGradeQuiz(submission);
        } else {
            submission.setStatus(LevelActivitySubmission.SubmissionStatus.SUBMITTED);
        }

        LevelActivitySubmission saved = submissionRepository.save(submission);
        return mapSubmissionToDTO(saved);
    }

    @Transactional
    public boolean canCompleteLevel(Integer levelId) {
        User currentUser = authService.getUser();

        // Get all required activities for the level
        List<LevelActivity> requiredActivities = levelActivityRepository.findByLevelLevelId(levelId)
                .stream()
                .filter(LevelActivity::getIsRequired)
                .collect(Collectors.toList());

        // Check if all required activities are completed
        for (LevelActivity activity : requiredActivities) {
            List<LevelActivitySubmission> submissions = submissionRepository
                    .findByStudentUserIdAndActivityActivityIdOrderByAttemptNumberDesc(
                            currentUser.getUserId(), activity.getActivityId());

            if (submissions.isEmpty()) {
                return false; // No submission for required activity
            }

            LevelActivitySubmission latest = submissions.get(0);
            if (!latest.isPassed()) {
                return false; // Latest submission didn't pass
            }
        }

        return true;
    }

    @Transactional
    public String completeLevel(Integer levelId) {
        User currentUser = authService.getUser();

        // Validate that all requirements are met
        if (!canCompleteLevel(levelId)) {
            throw new RuntimeException("Cannot complete level: All required activities must be passed first");
        }

        // Get the level to find the course
        CourseLevel courseLevel = courseLevelRepository.findById(levelId)
                .orElseThrow(() -> new RuntimeException("Level not found"));

        // Find or create student progress for this level
        Optional<StudentProgress> existingProgress = progressRepository
                .findByStudentUserIdAndCourseCourseIdAndLevelLevelId(
                        currentUser.getUserId(), courseLevel.getCourse().getCourseId(), levelId);

        StudentProgress progress;
        if (existingProgress.isPresent()) {
            progress = existingProgress.get();
        } else {
            // Create new progress record
            progress = new StudentProgress();
            progress.setStudent(currentUser);
            progress.setCourse(courseLevel.getCourse());
            progress.setLevel(courseLevel);
        }

        // Mark as completed
        progress.setProgressStatus(StudentProgress.ProgressStatus.completed);
        progress.setCompletionDate(java.time.LocalDate.now());

        progressRepository.save(progress);

        return "Level " + levelId + " completed successfully!";
    }


    private void validateStudentAccess(Integer courseId) {
        User currentUser = authService.getUser();
        // Check if student is enrolled in the course
        // This would typically check the StudentTeacherAssignment table
    }

    private void autoGradeQuiz(LevelActivitySubmission submission) {
        // Simple auto-grading logic - in a real system this would be more sophisticated
        // For now, we'll assume quizzes are manually graded
        submission.setStatus(LevelActivitySubmission.SubmissionStatus.SUBMITTED);
    }

    // ========== MAPPING METHODS ==========

    private LevelContentDTO mapContentToDTO(LevelContent content) {
        LevelContentDTO dto = new LevelContentDTO();
        dto.setContentId(content.getContentId());
        dto.setLevelId(content.getLevel().getLevelId());
        dto.setContentType(content.getContentType().name());
        dto.setTitle(content.getTitle());
        dto.setDescription(content.getDescription());
        dto.setContent(content.getContent());
        dto.setContentOrder(content.getContentOrder());
        dto.setIsRequired(content.getIsRequired());
        dto.setEstimatedMinutes(content.getEstimatedMinutes());
        dto.setCreatedAt(content.getCreatedAt());
        dto.setUpdatedAt(content.getUpdatedAt());
        return dto;
    }

    private LevelActivityDTO mapActivityToDTO(LevelActivity activity) {
        LevelActivityDTO dto = new LevelActivityDTO();
        dto.setActivityId(activity.getActivityId());
        dto.setLevelId(activity.getLevel().getLevelId());
        dto.setActivityType(activity.getActivityType().name());
        dto.setTitle(activity.getTitle());
        dto.setDescription(activity.getDescription());
        dto.setInstructions(activity.getInstructions());
        dto.setContent(activity.getContent());
        dto.setPassingScore(activity.getPassingScore());
        dto.setMaxAttempts(activity.getMaxAttempts());
        dto.setTimeLimitMinutes(activity.getTimeLimitMinutes());
        dto.setIsRequired(activity.getIsRequired());
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setUpdatedAt(activity.getUpdatedAt());
        return dto;
    }

    private LevelActivitySubmissionDTO mapSubmissionToDTO(LevelActivitySubmission submission) {
        LevelActivitySubmissionDTO dto = new LevelActivitySubmissionDTO();
        dto.setSubmissionId(submission.getSubmissionId());
        dto.setStudentId(submission.getStudent().getUserId());
        dto.setActivityId(submission.getActivity().getActivityId());
        dto.setAttemptNumber(submission.getAttemptNumber());
        dto.setAnswers(submission.getAnswers());
        dto.setSubmissionContent(submission.getSubmissionContent());
        dto.setScore(submission.getScore());
        dto.setMaxScore(submission.getMaxScore());
        dto.setPercentage(submission.getPercentage());
        dto.setStatus(submission.getStatus().name());
        dto.setTimeTakenMinutes(submission.getTimeTakenMinutes());
        dto.setFeedback(submission.getFeedback());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setGradedAt(submission.getGradedAt());
        dto.setUpdatedAt(submission.getUpdatedAt());
        dto.setIsPassed(submission.isPassed());
        return dto;
    }
}
