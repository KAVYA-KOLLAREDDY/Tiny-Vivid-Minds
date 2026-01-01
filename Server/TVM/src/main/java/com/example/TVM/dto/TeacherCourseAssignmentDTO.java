package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCourseAssignmentDTO {
    private Integer assignmentId;
    private Integer teacherId;
    private String teacherName;
    private String teacherEmail;
    private Integer courseId;
    private String courseName;
    private LocalDateTime assignedAt;
}

