package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Integer attendanceId;
    private Integer studentId;
    private String studentName;
    private Integer courseId;
    private String courseName;
    private Integer teacherId;
    private String teacherName;
    private LocalDate classDate;
    private String status; // Present, Absent, Rescheduled
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

