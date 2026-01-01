package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseLevelDTO {
    private Integer levelId;
    private Integer courseId;
    private Integer levelNumber;
    private String levelName;
    private String objectives;
    private Integer durationWeeks;
}

