package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "level_activity_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LevelActivitySubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Integer submissionId;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private LevelActivity activity;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber = 1;

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON string of answers for quizzes

    @Column(columnDefinition = "TEXT")
    private String submissionContent; // For assignments/projects

    @Column(name = "score")
    private Integer score;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(name = "percentage")
    private Double percentage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SubmissionStatus status = SubmissionStatus.IN_PROGRESS;

    @Column(name = "time_taken_minutes")
    private Integer timeTakenMinutes;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SubmissionStatus {
        IN_PROGRESS, SUBMITTED, GRADED, PASSED, FAILED
    }

    // Helper method to check if passed
    public boolean isPassed() {
        return status == SubmissionStatus.PASSED ||
               (percentage != null && percentage >= (activity != null ? activity.getPassingScore() : 60));
    }
}
