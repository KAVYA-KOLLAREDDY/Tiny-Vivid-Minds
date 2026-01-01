package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelContentDTO {
    private Integer contentId;
    private Integer levelId;
    private String contentType;
    private String title;
    private String description;
    private String content;
    private Integer contentOrder;
    private Boolean isRequired;
    private Integer estimatedMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
