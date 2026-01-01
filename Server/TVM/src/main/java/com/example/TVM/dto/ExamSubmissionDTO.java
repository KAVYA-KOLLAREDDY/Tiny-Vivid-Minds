package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmissionDTO {
    private Integer submissionId;
    private Integer studentId;
    private String studentName;
    private Integer courseId;
    private String courseName;
    private Integer teacherId;
    private String teacherName;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String status; // Pending, Graded, Approved, Rejected
    private Double grade;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private String remarks;
    private String submittedNotes;
    private LocalDateTime submittedOn;
    private LocalDateTime updatedAt;
    private LocalDateTime gradedAt;
}

