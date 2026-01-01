package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDTO {
    private Integer certificateId;
    private Integer studentId;
    private String studentName;
    private Integer courseId;
    private String courseName;
    private String verificationCode;
    private String downloadUrl;
    private String certificatePath;
    private Double percentage;
    private String completedLevel;
    private Integer examSubmissionId;
    private LocalDateTime issuedDate;
}


