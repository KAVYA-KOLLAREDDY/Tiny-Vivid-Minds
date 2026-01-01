package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "student_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {

    @Id
    @Column(name = "student_id")
    private Integer studentId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "student_id")
    private User user;

    private Integer age;

    @Column(name = "class_level")
    private String classLevel;

    @Column(name = "parent_name")
    private String parentName;

    @Column(name = "contact_number")
    private String contactNumber;
}

