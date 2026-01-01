package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelActivitySubmissionDTO {
    private Integer submissionId;
    private Integer studentId;
    private Integer activityId;
    private Integer attemptNumber;
    private String answers;
    private String submissionContent;
    private Integer score;
    private Integer maxScore;
    private Double percentage;
    private String status;
    private Integer timeTakenMinutes;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private LocalDateTime updatedAt;
    private Boolean isPassed;
}
