package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionDTO {
    private Double grade;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private String remarks;
    private String status; // Graded, Approved, Rejected
}

