package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequestDTO {
    private Integer studentId;
    private Integer courseId;
    private Integer teacherId;
    private LocalDate classDate;
    private String status; // Present, Absent, Rescheduled
    private String remarks;
}

