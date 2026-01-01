package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "join_us")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinUs {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String phone;
    
    @Column(nullable = false)
    private String qualification;
    
    @Column(nullable = false)
    private String experience;
    
    @Column(name = "preferred_subject", nullable = false)
    private String preferredSubject;
    
    @Column(nullable = false)
    private String availability;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private String resume;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "VARCHAR(20) DEFAULT 'pending'")
    private ApplicationStatus status = ApplicationStatus.PENDING;
    
    public enum ApplicationStatus {
        PENDING, REVIEWED, ACCEPTED, REJECTED
    }
}
