package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgressDTO {
    private Integer progressId;
    private Integer studentId;
    private Integer courseId;
    private Integer levelId;
    private String progressStatus;
    private LocalDate completionDate;
    private String remarks;
}

