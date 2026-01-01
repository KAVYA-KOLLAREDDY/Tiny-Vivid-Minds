package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherRegistrationDTO {
    private String fullName;
    private String email;
    private String password;
    private String qualification;
    private Integer experienceYears;
    private String specialization;
    private String bio;
}

