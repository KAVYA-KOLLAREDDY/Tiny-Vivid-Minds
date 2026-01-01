package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelActivityDTO {
    private Integer activityId;
    private Integer levelId;
    private String activityType;
    private String title;
    private String description;
    private String instructions;
    private String content;
    private Integer passingScore;
    private Integer maxAttempts;
    private Integer timeLimitMinutes;
    private Boolean isRequired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
