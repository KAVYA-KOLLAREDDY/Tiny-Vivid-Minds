package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmissionRequestDTO {
    private Integer courseId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String submittedNotes;
}

