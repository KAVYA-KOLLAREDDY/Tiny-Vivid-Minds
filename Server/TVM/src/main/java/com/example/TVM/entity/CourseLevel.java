package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "course_levels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "level_id")
    private Integer levelId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "level_number", nullable = false)
    private Integer levelNumber;

    @Column(name = "level_name")
    private String levelName;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "duration_weeks")
    private Integer durationWeeks;
}

