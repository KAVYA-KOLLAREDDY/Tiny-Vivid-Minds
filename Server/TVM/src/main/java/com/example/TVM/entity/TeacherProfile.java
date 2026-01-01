package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "teacher_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherProfile {

    @Id
    @Column(name = "teacher_id")
    private Integer teacherId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "teacher_id")
    private User user;

    private String qualification;

    @Column(name = "experience_years")
    private Integer experienceYears;

    private String specialization;

    @Column(columnDefinition = "TEXT")
    private String bio;
}

