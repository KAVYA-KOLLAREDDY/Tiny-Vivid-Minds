package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "certificate_id")
    private Integer certificateId;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "verification_code", unique = true, nullable = false, length = 50)
    private String verificationCode;

    @Column(name = "download_url", columnDefinition = "TEXT")
    private String downloadUrl;

    @Column(name = "certificate_path", columnDefinition = "TEXT")
    private String certificatePath;

    @Column(name = "percentage")
    private Double percentage;

    @Column(name = "completed_level")
    private String completedLevel;

    @Column(name = "exam_submission_id")
    private Integer examSubmissionId;

    @CreationTimestamp
    @Column(name = "issued_date", nullable = false, updatable = false)
    private LocalDateTime issuedDate;
}


