package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassScheduleDTO {
    private Integer classId;
    private Integer assignmentId;
    private LocalDateTime scheduledDate;
    private Integer durationMinutes;
    private String topic;
    private Integer levelId;
    private String status;
}

